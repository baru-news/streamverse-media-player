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

# ---------- Pyrogram ----------
from pyrogram import Client, filters, types

# Handler imports (support both package and direct execution)
try:
    from .handlers.upload_handler import UploadHandler
    from .handlers.admin_handler import AdminHandler
    from .handlers.auth_handler import AuthHandler
    from .utils.supabase_client import SupabaseManager
except Exception:
    from handlers.upload_handler import UploadHandler
    from handlers.admin_handler import AdminHandler
    from handlers.auth_handler import AuthHandler
    from utils.supabase_client import SupabaseManager

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

# ---------- Initialize handlers ----------
supabase_manager = SupabaseManager()
upload_handler = UploadHandler(supabase_manager)
admin_handler = AdminHandler(supabase_manager)
auth_handler = AuthHandler(supabase_manager)

# Import notification bot for real-time admin notifications
try:
    from .utils.telegram_bot import TelegramNotificationBot
except Exception:
    from utils.telegram_bot import TelegramNotificationBot

# ---------- Basic commands ----------
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

# ---------- Auto upload & admin/auth handlers ----------

# Auto-upload videos/documents from premium groups
app.on_message(filters.group & (filters.video | filters.document))(upload_handler.handle_group_upload)

# Initialize notification bot for real-time admin notifications
notification_bot = None

# Callback query handler for inline keyboard interactions
@app.on_callback_query()
async def handle_callback_query(client: Client, callback_query):
    """Handle inline keyboard callback queries"""
    try:
        global notification_bot
        if not notification_bot:
            notification_bot = TelegramNotificationBot(client, supabase_manager)
        
        await notification_bot.handle_callback_query(callback_query)
        
    except Exception as e:
        logger.error(f"Error handling callback query: {e}")
        await callback_query.answer("❌ Error processing request", show_alert=True)

# Admin commands - Enhanced with new functionality
app.on_message(filters.me & filters.command(["start"], prefixes=["/", "!", "."]))(admin_handler.handle_start)
app.on_message(filters.me & filters.command(["status"], prefixes=["/", "!", "."]))(admin_handler.handle_status)
app.on_message(filters.me & filters.command(["groups"], prefixes=["/", "!", "."]))(admin_handler.handle_groups)
app.on_message(filters.me & filters.command(["addgroup"], prefixes=["/", "!", "."]))(admin_handler.handle_add_group)
app.on_message(filters.me & filters.command(["sync"], prefixes=["/", "!", "."]))(admin_handler.handle_sync)
app.on_message(filters.me & filters.command(["retry"], prefixes=["/", "!", "."]))(admin_handler.handle_retry_upload)
app.on_message(filters.me & filters.command(["failures"], prefixes=["/", "!", "."]))(admin_handler.handle_failures)
app.on_message(filters.me & filters.command(["stats"], prefixes=["/", "!", "."]))(admin_handler.handle_stats)

# Account linking command for users
app.on_message(filters.command(["link"], prefixes=["/", "!", "."]))(auth_handler.handle_link_account)

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
        
        # Set client reference for upload handler notifications
        upload_handler.set_client(app)
        
        # Initialize notification bot
        global notification_bot
        notification_bot = TelegramNotificationBot(app, supabase_manager)
        
        # Start periodic cleanup task for expired callbacks
        async def cleanup_task():
            while True:
                try:
                    await notification_bot.cleanup_expired_callbacks()
                    await asyncio.sleep(3600)  # Clean up every hour
                except Exception as e:
                    logger.error(f"Error in cleanup task: {e}")
                    await asyncio.sleep(300)  # Retry in 5 minutes on error
        
        # Start cleanup task in background
        cleanup_task_handle = asyncio.create_task(cleanup_task())
        
        logger.info("✅ Userbot started with real-time admin notifications")
        await stop_event.wait()
        
        # Cancel cleanup task on shutdown
        cleanup_task_handle.cancel()
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