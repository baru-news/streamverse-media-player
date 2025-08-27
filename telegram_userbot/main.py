#!/usr/bin/env python3
"""
Telegram User Bot - Production-safe
- Load .env di folder yang sama dengan file ini
- 2 mode login:
  A) SESSION_STRING (non-interaktif, tidak minta OTP)
  B) Phone login (interaktif PERTAMA KALI, simpan file session ke SESSION_DIR)
- Doodstream dual API (opsional) via perintah /dood <url> dan /doodfile (reply media)
"""

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path
from typing import Optional

from pythonjsonlogger import jsonlogger
from dotenv import load_dotenv

# ---------- Logging JSON ----------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
_handler = logging.StreamHandler(sys.stdout)
_formatter = jsonlogger.JsonFormatter("%(asctime)s %(name)s %(levelname)s %(message)s")
_handler.setFormatter(_formatter)
logger.addHandler(_handler)

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

def env_str(key: str, required: bool = False, default: Optional[str] = None) -> Optional[str]:
    val = os.environ.get(key, default)
    if required and (val is None or str(val).strip() == ""):
        raise RuntimeError(f"{key} is required in .env file")
    return val

# ---------- Telegram creds ----------
# dukung nama TELEGRAM_* (baru) dan fallback ke API_ID/API_HASH (lama)
API_ID  = int(env_str("TELEGRAM_API_ID", default=os.environ.get("API_ID") or "0"))
API_HASH = env_str("TELEGRAM_API_HASH", default=os.environ.get("API_HASH") or "")
if API_ID == 0 or not API_HASH:
    raise RuntimeError("TELEGRAM_API_ID and TELEGRAM_API_HASH are required")

PHONE_NUMBER   = env_str("TELEGRAM_PHONE_NUMBER", default="")
SESSION_STRING = env_str("SESSION_STRING", default="").strip()

# Direktori
SESSION_DIR  = Path(env_str("SESSION_DIR", default=str(HERE / ".sessions")))
DOWNLOAD_DIR = Path(env_str("DOWNLOAD_DIR", default=str(HERE / "downloads")))
SESSION_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ---------- Supabase (opsional) ----------
SUPABASE_URL = env_str("SUPABASE_URL", default="")
SUPABASE_SERVICE_ROLE_KEY = env_str("SUPABASE_SERVICE_ROLE_KEY", default=os.environ.get("SUPABASE_KEY") or "")
SUPABASE_ANON_KEY = env_str("SUPABASE_ANON_KEY", default="")  # optional
supabase = None
if SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY):
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)
        logger.info("✅ Supabase client initialized")
    except Exception as e:
        logger.exception(f"Supabase init failed: {e}")

# ---------- Pyrogram ----------
from pyrogram import Client, filters, types

def build_client() -> Client:
    """
    Jika SESSION_STRING ada -> pakai session_string (tanpa prompt).
    Jika tidak ada -> file session (akan minta OTP saat pertama kali start).
    """
    base_kwargs = dict(
        api_id=API_ID,
        api_hash=API_HASH,
        workdir=str(SESSION_DIR),
        in_memory=False,
        no_updates=False,
    )
    if SESSION_STRING:
        logger.info("🔐 Using SESSION_STRING login mode (non-interactive)")
        return Client(name="userbot_session", session_string=SESSION_STRING, **base_kwargs)
    else:
        logger.info("📱 Using PHONE login mode (file session). "
                    "First run may ask phone/OTP/2FA in the terminal.")
        if not PHONE_NUMBER:
            logger.info("ℹ️ TELEGRAM_PHONE_NUMBER is not set. Prepare to enter it when prompted.")
        # TANPA session_string -> pyrogram akan gunakan file session
        return Client(name="userbot_session", **base_kwargs)

app = build_client()

# ---------- Handlers ----------
@app.on_message(filters.me & filters.command(["ping"], prefixes=["/", "!", "."]))
async def ping_handler(client: Client, message: types.Message):
    await message.reply_text("pong")

# Doodstream dual upload
try:
    from .doodstream_client import (
        dood_remote_upload_all,
        dood_upload_file_all,
        has_any_dood_account,
    )
except Exception:
    # fallback import saat dijalankan tanpa package relative
    from doodstream_client import (
        dood_remote_upload_all,
        dood_upload_file_all,
        has_any_dood_account,
    )

@app.on_message(filters.me & filters.command(["dood"], prefixes=["/", "!", "."]))
async def dood_remote_handler(client: Client, message: types.Message):
    if not has_any_dood_account():
        return await message.reply_text("Doodstream not configured. Set DOODSTREAM_API_KEY or DOODSTREAM_PREMIUM_API_KEY in .env")
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        return await message.reply_text("Usage: /dood <url>")
    url = args[1].strip()
    await message.reply_text("⏫ Uploading to Doodstream...")
    results = await dood_remote_upload_all(url)
    lines = []
    for label, res in results:
        if isinstance(res, Exception):
            lines.append(f"- {label}: ❌ {res}")
        else:
            # res expected dict with url or error
            if res.get("success"):
                lines.append(f"- {label}: ✅ {res.get('url')}")
            else:
                lines.append(f"- {label}: ❌ {res.get('error')}")
    await message.reply_text("\n".join(lines) or "No result")

@app.on_message(filters.me & filters.command(["doodfile"], prefixes=["/", "!", "."]))
async def dood_file_handler(client: Client, message: types.Message):
    if not has_any_dood_account():
        return await message.reply_text("Doodstream not configured. Set DOODSTREAM_API_KEY or DOODSTREAM_PREMIUM_API_KEY in .env")
    if not message.reply_to_message or not (message.reply_to_message.document or message.reply_to_message.video):
        return await message.reply_text("Reply a file/video with: /doodfile")
    # download ke DOWNLOAD_DIR
    await message.reply_text("⬇️ Downloading file...")
    path = await client.download_media(message.reply_to_message, file_name=str(DOWNLOAD_DIR))
    await message.reply_text("⏫ Uploading file to Doodstream...")
    results = await dood_upload_file_all(path)
    lines = []
    for label, res in results:
        if isinstance(res, Exception):
            lines.append(f"- {label}: ❌ {res}")
        else:
            if res.get("success"):
                lines.append(f"- {label}: ✅ {res.get('url')}")
            else:
                lines.append(f"- {label}: ❌ {res.get('error')}")
    await message.reply_text("\n".join(lines) or "No result")

# ---------- Lifecycle ----------
async def main():
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop_event.set)
        except NotImplementedError:
            pass

    try:
        logger.info("🚀 Starting Telegram User Bot...")
        await app.start()
        logger.info("✅ Userbot started")
        await stop_event.wait()
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        sys.exit(1)
    finally:
        try:
            logger.info("🛑 Stopping Telegram User Bot...")
            await app.stop()
            logger.info("✅ Userbot stopped")
        except Exception as e:
            logger.error(f"Error stopping bot: {e}")

if __name__ == "__main__":
    asyncio.run(main())