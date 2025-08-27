#!/usr/bin/env python3
"""
Telegram User Bot - Simplified Production Version
Ubuntu 22.04 optimized with proper virtual environment support
"""

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    import uvloop
    uvloop.install()
except ImportError:
    pass

from dotenv import load_dotenv
from pyrogram import Client, filters
from pyrogram.types import Message

# JSON Logging setup
try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False

try:
    from loguru import logger as loguru_logger
    HAS_LOGURU = True
except ImportError:
    HAS_LOGURU = False

# Optional Supabase
try:
    from supabase import create_client, Client as SupabaseClient
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

class TelegramUserBot:
    def __init__(self):
        """Initialize the Telegram User Bot"""
        # Load environment variables
        load_dotenv()
        
        # Setup logging
        self.setup_logging()
        self.logger = logging.getLogger(__name__)
        
        # Configuration from environment
        self.api_id = os.getenv("API_ID")
        self.api_hash = os.getenv("API_HASH")
        self.session_string = os.getenv("SESSION_STRING")
        
        # Validate required configuration
        if not self.api_id or not self.api_hash:
            raise ValueError("API_ID and API_HASH are required in .env file")
        
        # Initialize Supabase (optional)
        self.supabase = None
        if HAS_SUPABASE:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            if supabase_url and supabase_key:
                try:
                    self.supabase = create_client(supabase_url, supabase_key)
                    self.logger.info("✅ Supabase client initialized")
                except Exception as e:
                    self.logger.error(f"❌ Failed to initialize Supabase: {e}")
        
        # Initialize Pyrogram User Client
        self.app = Client(
            "userbot_session",
            api_id=int(self.api_id),
            api_hash=self.api_hash,
            session_string=self.session_string if self.session_string else None,
            workdir=str(Path(__file__).parent / ".sessions")
        )
        
        # Setup handlers
        self.setup_handlers()
        
        # Shutdown flag
        self.shutdown_event = asyncio.Event()
        
    def setup_logging(self):
        """Setup JSON logging with fallback to standard logging"""
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        
        if HAS_JSON_LOGGER:
            # JSON structured logging
            formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(name)s %(levelname)s %(message)s'
            )
            handler = logging.StreamHandler()
            handler.setFormatter(formatter)
            
            logging.basicConfig(
                level=getattr(logging, log_level),
                handlers=[handler]
            )
        else:
            # Standard logging
            logging.basicConfig(
                level=getattr(logging, log_level),
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        
        # Reduce pyrogram logging noise
        logging.getLogger("pyrogram").setLevel(logging.WARNING)
        
    def setup_handlers(self):
        """Setup message handlers"""
        
        @self.app.on_message(filters.private & filters.command("ping"))
        async def ping_handler(client: Client, message: Message):
            """Simple ping handler"""
            try:
                await message.reply_text("🏓 pong")
                self.logger.info(f"Ping from user {message.from_user.id}")
            except Exception as e:
                self.logger.error(f"Error in ping handler: {e}")
        
        @self.app.on_message(filters.private & filters.command("save"))
        async def save_handler(client: Client, message: Message):
            """Save message to Supabase (if configured)"""
            try:
                if not self.supabase:
                    await message.reply_text("❌ Supabase not configured")
                    return
                
                # Extract text to save
                command_parts = message.text.split(" ", 1)
                if len(command_parts) < 2:
                    await message.reply_text("❌ Usage: /save <text>")
                    return
                
                text_to_save = command_parts[1]
                
                # Save to Supabase
                result = self.supabase.table("messages").insert({
                    "user_id": str(message.from_user.id),
                    "username": message.from_user.username or "unknown",
                    "message": text_to_save,
                    "created_at": "now()"
                }).execute()
                
                if result.data:
                    await message.reply_text(f"✅ Saved: {text_to_save}")
                    self.logger.info(f"Saved message from user {message.from_user.id}: {text_to_save}")
                else:
                    await message.reply_text("❌ Failed to save")
                    
            except Exception as e:
                self.logger.error(f"Error in save handler: {e}")
                await message.reply_text(f"❌ Error: {str(e)}")
        
        @self.app.on_message(filters.private & filters.command(["start", "help"]))
        async def help_handler(client: Client, message: Message):
            """Help command handler"""
            help_text = """
🤖 **Telegram User Bot**

**Available Commands:**
• `/ping` - Test bot responsiveness
• `/save <text>` - Save text to database (if configured)
• `/help` - Show this help message

**Status:**
• Supabase: {'✅ Connected' if self.supabase else '❌ Not configured'}
"""
            await message.reply_text(help_text)
    
    def setup_signal_handlers(self):
        """Setup graceful shutdown handlers"""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, shutting down gracefully...")
            self.shutdown_event.set()
        
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
    
    async def start(self):
        """Start the user bot"""
        try:
            self.logger.info("🚀 Starting Telegram User Bot...")
            
            # Setup signal handlers
            self.setup_signal_handlers()
            
            # Create required directories
            os.makedirs(Path(__file__).parent / ".sessions", exist_ok=True)
            
            # Start Pyrogram client
            await self.app.start()
            
            # Get user info
            me = await self.app.get_me()
            self.logger.info(f"✅ User Bot started successfully!")
            self.logger.info(f"👤 Logged in as: {me.first_name} (@{me.username})")
            self.logger.info(f"🆔 User ID: {me.id}")
            
            # Test Supabase connection if available
            if self.supabase:
                try:
                    # Simple connection test
                    result = self.supabase.table("messages").select("*").limit(1).execute()
                    self.logger.info("✅ Supabase connection test successful")
                except Exception as e:
                    self.logger.warning(f"⚠️ Supabase connection test failed: {e}")
            
            self.logger.info("🤖 Bot is now running. Send /help for commands.")
            
            # Wait for shutdown signal
            await self.shutdown_event.wait()
            
        except Exception as e:
            self.logger.error(f"❌ Failed to start bot: {e}")
            raise
    
    async def stop(self):
        """Stop the user bot"""
        self.logger.info("🛑 Stopping Telegram User Bot...")
        try:
            await self.app.stop()
            self.logger.info("✅ Bot stopped successfully")
        except Exception as e:
            self.logger.error(f"Error stopping bot: {e}")

async def main():
    """Main function with graceful shutdown"""
    bot = None
    try:
        bot = TelegramUserBot()
        await bot.start()
    except KeyboardInterrupt:
        logging.info("⚠️ Received keyboard interrupt")
    except Exception as e:
        logging.error(f"💥 Fatal error: {e}")
        sys.exit(1)
    finally:
        if bot:
            await bot.stop()

if __name__ == "__main__":
    asyncio.run(main())