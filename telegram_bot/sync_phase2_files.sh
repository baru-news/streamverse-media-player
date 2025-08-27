#!/bin/bash
# Phase 2: Complete remaining files for 100% sync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

verify_file() {
    local filepath=$1
    local expected_lines=$2
    local description=$3
    
    if [ ! -f "$filepath" ]; then
        echo -e "${RED}❌ $description: File not found at $filepath${NC}"
        return 1
    fi
    
    local actual_lines=$(wc -l < "$filepath")
    if [ "$actual_lines" -ne "$expected_lines" ]; then
        echo -e "${RED}❌ $description: Line count mismatch. Expected: $expected_lines, Got: $actual_lines${NC}"
        return 1
    fi
    
    success "$description: ✓ $actual_lines lines (correct)"
    return 0
}

BOT_DIR="/opt/telegram-bot/telegram_bot"

echo ""
echo "📄 FASE 3B: COMPLETING HANDLER FILES"
echo "=================================="

echo ""
echo "📝 Creating auth_handler.py (200 lines)..."
cat > $BOT_DIR/handlers/auth_handler.py << 'AUTH_EOF'
import logging
from typing import Optional, Dict
from pyrogram import Client
from pyrogram.types import Message

class AuthHandler:
    """Handler for authentication-related commands and operations"""
    
    def __init__(self, supabase):
        """Initialize the auth handler with Supabase client"""
        self.supabase = supabase
        self.logger = logging.getLogger(__name__)

    async def handle_start(self, client: Client, message: Message):
        """Handle the /start command"""
        try:
            user_id = message.from_user.id
            username = message.from_user.username or "Unknown"
            first_name = message.from_user.first_name or "User"
            
            self.logger.info(f"Start command from user {user_id} (@{username})")
            
            # Check if user is already linked
            profile = self.get_user_profile(user_id)
            
            if profile:
                welcome_text = f"""
🎉 **Welcome back, {first_name}!**

Your Telegram account is already linked to our platform.

**Your Account Status:**
• ✅ **Linked:** Your account is connected
• 📧 **Email:** {profile.get('email', 'Not set')}
• 👤 **Username:** {profile.get('username', 'Not set')}

**What you can do:**
• Send any video file to upload it automatically
• Use `/status` to check your account details
• Use `/help` for more commands

**Ready to upload videos!** 🎬
Just send me any video file and I'll process it for you.
                """
            else:
                welcome_text = f"""
🤖 **Welcome to Video Upload Bot, {first_name}!**

I help you upload videos automatically to our platform.

**Getting Started:**
1️⃣ First, you need to link your Telegram account
2️⃣ Use the command `/link` to get your linking code
3️⃣ Enter the code on our website to connect your accounts

**After linking:**
• Send any video file to upload it automatically
• I'll process and add it to the website
• You'll get notifications about upload progress

**Commands Available:**
• `/link` - Get your account linking code
• `/status` - Check your account status
• `/help` - Show all available commands

Let's get started! Use `/link` to begin. 🚀
                """
            
            await message.reply(welcome_text)
            
        except Exception as e:
            self.logger.error(f"Error in handle_start: {e}")
            await message.reply("❌ An error occurred while processing your request. Please try again.")

    async def handle_link_account(self, client: Client, message: Message):
        """Handle the /link command to generate linking codes"""
        try:
            user_id = message.from_user.id
            username = message.from_user.username or "Unknown"
            
            self.logger.info(f"Link command from user {user_id} (@{username})")
            
            # Check if already linked
            if self.is_user_linked(user_id):
                await message.reply("""
✅ **Your account is already linked!**

Your Telegram account is connected to our platform.
You can start uploading videos by sending them to me.

Use `/status` to see your account details.
                """)
                return
            
            # Generate link code
            link_code = self.supabase.create_telegram_link_code(user_id, username)
            
            if link_code:
                link_message = f"""
🔗 **Account Linking Code Generated**

Your unique linking code is: **`{link_code}`**

**How to link your account:**
1️⃣ Go to our website and log in to your account
2️⃣ Navigate to your profile settings
3️⃣ Find the "Link Telegram Account" section
4️⃣ Enter this code: **`{link_code}`**
5️⃣ Click "Link Account"

⏰ **Important:** This code expires in 10 minutes!

After linking, you can upload videos by sending them directly to me. 🎬

Need help? Contact our support team!
                """
            else:
                link_message = """
❌ **Failed to generate linking code**

There was an error creating your linking code. Please try again in a moment.

If the problem persists, contact our support team.
                """
            
            await message.reply(link_message)
            
        except Exception as e:
            self.logger.error(f"Error in handle_link_account: {e}")
            await message.reply("❌ An error occurred while generating your linking code. Please try again.")

    async def handle_status(self, client: Client, message: Message):
        """Handle the /status command to show account information"""
        try:
            user_id = message.from_user.id
            username = message.from_user.username or "Unknown"
            
            self.logger.info(f"Status command from user {user_id} (@{username})")
            
            # Get user profile
            profile = self.get_user_profile(user_id)
            
            if not profile:
                status_message = """
❌ **Account Not Linked**

Your Telegram account is not linked to our platform yet.

**To get started:**
1️⃣ Use `/link` to get your linking code
2️⃣ Enter the code on our website to connect your accounts
3️⃣ Start uploading videos!

Use `/help` for more information.
                """
            else:
                # Check premium status
                is_premium = self.supabase.is_premium_user(profile.get('id', ''))
                is_admin = self.is_user_admin(user_id)
                
                premium_status = "🔥 **Premium User**" if is_premium else "👤 **Regular User**"
                admin_status = " | 🔧 **Admin**" if is_admin else ""
                
                status_message = f"""
✅ **Account Status: LINKED**

**Account Information:**
• 📧 **Email:** {profile.get('email', 'Not set')}
• 👤 **Username:** {profile.get('username', 'Not set')}
• 🆔 **User ID:** {profile.get('id', 'Unknown')}
• 📱 **Telegram:** @{username} ({user_id})

**Subscription Status:**
{premium_status}{admin_status}

**Upload Features:**
• ✅ **Video Upload:** Available
• ✅ **Auto Processing:** Enabled
• ✅ **Progress Notifications:** Active

**Statistics:**
• 📊 Check your upload history on our website
• 🎬 All your videos are automatically processed
• 📈 Premium users get additional features

Ready to upload! Just send me any video file. 🚀
                """
            
            await message.reply(status_message)
            
        except Exception as e:
            self.logger.error(f"Error in handle_status: {e}")
            await message.reply("❌ An error occurred while checking your status. Please try again.")

    def get_user_profile(self, telegram_user_id: int) -> Optional[Dict]:
        """Get user profile by Telegram ID"""
        try:
            return self.supabase.get_profile_by_telegram_id(telegram_user_id)
        except Exception as e:
            self.logger.error(f"Error getting user profile: {e}")
            return None

    def is_user_linked(self, telegram_user_id: int) -> bool:
        """Check if Telegram user is linked to platform account"""
        profile = self.get_user_profile(telegram_user_id)
        return profile is not None

    def is_user_admin(self, telegram_user_id: int) -> bool:
        """Check if Telegram user has admin privileges"""
        try:
            return self.supabase.is_telegram_admin(telegram_user_id)
        except Exception as e:
            self.logger.error(f"Error checking admin status: {e}")
            return False
AUTH_EOF

verify_file "$BOT_DIR/handlers/auth_handler.py" 200 "handlers/auth_handler.py"

echo ""
echo "📝 Creating utils/__init__.py (1 line)..."
cat > $BOT_DIR/utils/__init__.py << 'UTILS_INIT_EOF'
"""Utils package for telegram bot"""
UTILS_INIT_EOF

verify_file "$BOT_DIR/utils/__init__.py" 1 "utils/__init__.py"

echo ""
echo "📝 Creating logger_setup.py (88 lines)..."
cat > $BOT_DIR/utils/logger_setup.py << 'LOGGER_EOF'
import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from typing import Optional

def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None) -> None:
    """
    Set up logging configuration for the telegram bot
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path. If None, uses default location
    """
    
    # Convert string log level to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Create logs directory if it doesn't exist
    log_dir = "/opt/telegram-bot/logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # Set default log file if not provided
    if log_file is None:
        log_file = os.path.join(log_dir, "telegram_bot.log")
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        fmt='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Clear any existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(simple_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation
    try:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(numeric_level)
        file_handler.setFormatter(detailed_formatter)
        root_logger.addHandler(file_handler)
    except Exception as e:
        print(f"Warning: Could not set up file logging: {e}")
    
    # Set specific logger levels for noisy libraries
    logging.getLogger('pyrogram').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    
    # Log the configuration
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {log_level}")
    
    # Test configuration
    try:
        logger.debug("Debug logging is working")
        logger.info("Info logging is working")
    except Exception as e:
        logger.error(f"Failed to initialize bot: {e}")
        raise

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)

def set_log_level(level: str) -> None:
    """
    Change the log level for all loggers
    
    Args:
        level: New log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    
    # Update root logger
    logging.getLogger().setLevel(numeric_level)
    
    # Update all handlers
    for handler in logging.getLogger().handlers:
        handler.setLevel(numeric_level)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Log level changed to: {level}")
LOGGER_EOF

verify_file "$BOT_DIR/utils/logger_setup.py" 88 "utils/logger_setup.py"

success "All remaining files created and verified!"

echo ""
echo "✅ PHASE 2 FILES COMPLETED!"
echo "=========================="
echo ""
echo "📋 FILES CREATED:"
echo "• auth_handler.py (200 lines)"
echo "• utils/__init__.py (1 line)" 
echo "• logger_setup.py (88 lines)"
echo ""
echo "📋 STILL NEEDED:"
echo "• admin_handler.py (277 lines)"
echo "• file_handler.py (391 lines)"
echo "• progress_tracker.py (165 lines)"
echo "• .env file setup"
echo ""
echo "🚀 Continue with sync_phase3_final.sh for completion!"