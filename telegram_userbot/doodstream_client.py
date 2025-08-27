import os
from pathlib import Path
from typing import List, Tuple, Dict, Any
import asyncio

import httpx
from dotenv import load_dotenv

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

DOOD_1 = os.environ.get("DOODSTREAM_API_KEY", "").strip()
DOOD_2 = os.environ.get("DOODSTREAM_PREMIUM_API_KEY", "").strip()
DOOD_DOMAIN = "https://doodapi.com"  # default

def _accounts() -> List[Tuple[str, str]]:
    accs = []
    if DOOD_1:
        accs.append(("acc1", DOOD_1))
    if DOOD_2:
        accs.append(("acc2", DOOD_2))
    return accs

def has_any_dood_account() -> bool:
    return len(_accounts()) > 0

# -------- Remote upload (URL) ----------
async def _remote_upload_one(label: str, api_key: str, url: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{DOOD_DOMAIN}/api/upload/url",
                data={"key": api_key, "url": url}
            )
            data = r.json()
            # response biasanya: {"status":200,"msg":"OK","result":{"filecode":"..."}}
            if data.get("status") == 200:
                filecode = (data.get("result") or {}).get("filecode")
                if filecode:
                    return {"success": True, "url": f"https://doodstream.com/d/{filecode}"}
                return {"success": False, "error": "No filecode in result"}
            return {"success": False, "error": data.get("msg") or str(data)}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def dood_remote_upload_all(url: str) -> List[Tuple[str, Dict[str, Any]]]:
    tasks = []
    for label, key in _accounts():
        tasks.append(_remote_upload_one(label, key, url))
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return list(zip([lbl for lbl, _ in _accounts()], results))

# -------- File upload ----------
async def _get_upload_server(api_key: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{DOOD_DOMAIN}/api/upload/server", params={"key": api_key})
        data = r.json()
        if data.get("status") == 200:
            return (data.get("result") or {}).get("server", "")
        raise RuntimeError(data.get("msg") or "Failed to get upload server")

async def _upload_file_one(label: str, api_key: str, path: str) -> Dict[str, Any]:
    try:
        server = await _get_upload_server(api_key)
        if not server:
            return {"success": False, "error": "No upload server"}
        # server biasanya berupa URL, contoh: https://upload.doodapi.com/upload
        async with httpx.AsyncClient(timeout=None) as client:
            with open(path, "rb") as f:
                files = {"file": (Path(path).name, f)}
                r = await client.post(server, data={"key": api_key}, files=files)
            data = r.json()
            # response: {"status":200,"msg":"OK","result":[{"filecode":"..."}]}
            if data.get("status") == 200:
                arr = data.get("result") or []
                if arr and arr[0].get("filecode"):
                    fc = arr[0]["filecode"]
                    return {"success": True, "url": f"https://doodstream.com/d/{fc}"}
                return {"success": False, "error": "No filecode in result array"}
            return {"success": False, "error": data.get("msg") or str(data)}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def dood_upload_file_all(path: str) -> List[Tuple[str, Dict[str, Any]]]:
    tasks = []
    for label, key in _accounts():
        tasks.append(_upload_file_one(label, key, path))
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return list(zip([lbl for lbl, _ in _accounts()], results))