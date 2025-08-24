#!/usr/bin/env python3
"""
Telegram User Bot for 2GB File Uploads
Integrates with Supabase and Doodstream API
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

from pyrogram import Client, filters, enums
from pyrogram.types import Message
import uvloop

from config import Config
from handlers.file_handler import FileHandler
from handlers.auth_handler import AuthHandler
from handlers.admin_handler import AdminHandler
from supabase_client import SupabaseManager
from utils.logger_setup import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self):
        self.config = Config()
        self.supabase = SupabaseManager()
        self.client = None
        
        # Initialize handlers
        self.file_handler = FileHandler(self.supabase)
        self.auth_handler = AuthHandler(self.supabase)
        self.admin_handler = AdminHandler(self.supabase)
        
    async def initialize(self):
        """Initialize the Telegram client"""
        try:
            self.client = Client(
                "telegram_bot",
                api_id=self.config.API_ID,
                api_hash=self.config.API_HASH,
                phone_number=self.config.PHONE_NUMBER,
                workdir=self.config.SESSION_DIR
            )
            
            # Register handlers
            await self._register_handlers()
            
            logger.info("Bot initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize bot: {e}")
            return False
    
    async def _register_handlers(self):
        """Register all message handlers"""
        
        # File upload handler for videos
        @self.client.on_message(filters.video & filters.private)
        async def handle_video_upload(client, message: Message):
            await self.file_handler.handle_file_upload(client, message)
        
        # File upload handler for documents (videos as documents)
        @self.client.on_message(filters.document & filters.private)
        async def handle_document_upload(client, message: Message):
            if message.document.mime_type and message.document.mime_type.startswith('video/'):
                await self.file_handler.handle_file_upload(client, message)
        
        # Premium group auto-upload handler
        @self.client.on_message(filters.group & (filters.video | filters.document))
        async def handle_group_upload(client, message: Message):
            await self.file_handler.handle_group_upload(client, message)
        
        # Auth commands
        @self.client.on_message(filters.command("start") & filters.private)
        async def handle_start(client, message: Message):
            await self.auth_handler.handle_start(client, message)
        
        @self.client.on_message(filters.command("link") & filters.private)
        async def handle_link(client, message: Message):
            await self.auth_handler.handle_link_account(client, message)
        
        @self.client.on_message(filters.command("status") & filters.private)
        async def handle_status(client, message: Message):
            await self.auth_handler.handle_status(client, message)
        
        # Admin commands
        @self.client.on_message(filters.command("admin") & filters.private)
        async def handle_admin(client, message: Message):
            await self.admin_handler.handle_admin_command(client, message)
        
        @self.client.on_message(filters.command("groups") & filters.private)
        async def handle_groups(client, message: Message):
            await self.admin_handler.handle_list_groups(client, message)
        
        @self.client.on_message(filters.command("addgroup") & filters.private)
        async def handle_add_group(client, message: Message):
            await self.admin_handler.handle_add_group(client, message)
        
        # Help command
        @self.client.on_message(filters.command("help") & filters.private)
        async def handle_help(client, message: Message):
            help_text = """
🤖 **Telegram Upload Bot Commands**

**General Commands:**
• `/start` - Start using the bot
• `/link` - Link your Telegram account to the website
• `/status` - Check your account status
• `/help` - Show this help message

**File Upload:**
• Send any video file (up to 2GB) to upload to the platform
• Supported formats: MP4, AVI, MKV, MOV, etc.

**Admin Commands:**
• `/admin` - Admin panel
• `/groups` - List premium groups
• `/addgroup <chat_id>` - Add premium group for auto-upload

**Notes:**
• Link your account first to upload files
• Premium users get priority upload processing
• Files are automatically uploaded to both regular and premium Doodstream accounts
            """
            await message.reply_text(help_text)
        
        logger.info("All handlers registered successfully")
    
    async def start(self):
        """Start the bot"""
        try:
            if not await self.initialize():
                logger.error("Failed to initialize bot")
                return False
            
            await self.client.start()
            logger.info("Bot started successfully")
            
            # Get bot info
            me = await self.client.get_me()
            logger.info(f"Bot running as: {me.first_name} (@{me.username}) - ID: {me.id}")
            
            # Keep the bot running
            await asyncio.Event().wait()
            
        except KeyboardInterrupt:
            logger.info("Bot stopped by user")
        except Exception as e:
            logger.error(f"Bot error: {e}")
        finally:
            if self.client:
                await self.client.stop()
            logger.info("Bot stopped")
    
    async def stop(self):
        """Stop the bot gracefully"""
        if self.client:
            await self.client.stop()
        logger.info("Bot stopped gracefully")

async def main():
    """Main function"""
    # Use uvloop for better performance
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    
    bot = TelegramBot()
    
    try:
        await bot.start()
    except Exception as e:
        logger.error(f"Critical error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())