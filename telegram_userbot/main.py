#!/usr/bin/env python3
"""
Telegram User Bot - Auto Upload to Premium Groups
Uses MTProto API (not Bot API) for full user functionality
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from pyrogram import Client, filters
from pyrogram.types import Message
from config import Config
from handlers.upload_handler import UploadHandler
from handlers.admin_handler import AdminHandler
from handlers.auth_handler import AuthHandler
from utils.logger_setup import setup_logging
from utils.supabase_client import SupabaseManager

# Setup logging
logger = setup_logging()

class TelegramUserBot:
    def __init__(self):
        self.config = Config()
        self.supabase = SupabaseManager()
        
        # Initialize Pyrogram User Client (NOT BOT CLIENT!)
        self.app = Client(
            name="userbot_session",
            api_id=self.config.TELEGRAM_API_ID,
            api_hash=self.config.TELEGRAM_API_HASH,
            phone_number=self.config.TELEGRAM_PHONE_NUMBER,
            workdir=self.config.SESSION_DIR
        )
        
        # Initialize handlers
        self.upload_handler = UploadHandler(self.supabase)
        self.admin_handler = AdminHandler(self.supabase)
        self.auth_handler = AuthHandler(self.supabase)
        
        # Setup handlers
        self.setup_handlers()
        
    def setup_handlers(self):
        """Setup message and command handlers"""
        
        # Admin commands (private messages only)
        @self.app.on_message(filters.private & filters.command(["start", "help"]))
        async def start_command(client, message: Message):
            await self.admin_handler.handle_start(client, message)
            
        @self.app.on_message(filters.private & filters.command("status"))
        async def status_command(client, message: Message):
            await self.admin_handler.handle_status(client, message)
            
        @self.app.on_message(filters.private & filters.command("groups"))
        async def groups_command(client, message: Message):
            await self.admin_handler.handle_groups(client, message)
            
        @self.app.on_message(filters.private & filters.command("addgroup"))
        async def add_group_command(client, message: Message):
            await self.admin_handler.handle_add_group(client, message)
            
        @self.app.on_message(filters.private & filters.command("sync"))
        async def sync_command(client, message: Message):
            await self.admin_handler.handle_sync(client, message)
        
        # File upload handler for premium groups
        @self.app.on_message(filters.group & (filters.video | filters.document))
        async def handle_group_upload(client, message: Message):
            await self.upload_handler.handle_group_upload(client, message)
            
        # Authentication handler for private messages
        @self.app.on_message(filters.private & filters.command("link"))
        async def link_account(client, message: Message):
            await self.auth_handler.handle_link_account(client, message)

    async def start(self):
        """Start the user bot"""
        try:
            logger.info("🚀 Starting Telegram User Bot...")
            
            # Start client
            await self.app.start()
            
            # Get user info
            me = await self.app.get_me()
            logger.info(f"✅ User Bot started successfully!")
            logger.info(f"👤 Logged in as: {me.first_name} (@{me.username})")
            logger.info(f"📱 Phone: {me.phone_number}")
            logger.info(f"🆔 User ID: {me.id}")
            
            # Test Supabase connection
            if await self.supabase.test_connection():
                logger.info("✅ Supabase connection successful")
            else:
                logger.error("❌ Supabase connection failed")
                
            logger.info("🤖 Bot is now running and monitoring premium groups...")
            logger.info("💬 Send /help in private to see available commands")
            
            # Keep the bot running
            await asyncio.Event().wait()
            
        except Exception as e:
            logger.error(f"❌ Failed to start bot: {e}")
            raise
            
    async def stop(self):
        """Stop the user bot"""
        logger.info("🛑 Stopping Telegram User Bot...")
        await self.app.stop()
        logger.info("✅ Bot stopped successfully")

async def main():
    """Main function"""
    bot = TelegramUserBot()
    
    try:
        await bot.start()
    except KeyboardInterrupt:
        logger.info("⚠️  Received keyboard interrupt")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        raise
    finally:
        await bot.stop()

if __name__ == "__main__":
    # Create required directories
    os.makedirs("/opt/telegram-userbot/sessions", exist_ok=True)
    os.makedirs("/opt/telegram-userbot/downloads", exist_ok=True)
    os.makedirs("/opt/telegram-userbot/logs", exist_ok=True)
    
    # Run bot
    asyncio.run(main())