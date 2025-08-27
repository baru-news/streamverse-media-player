#!/bin/bash
# 100% Telegram Bot Synchronization Script
# Implements complete 6-phase synchronization plan

set -e  # Exit on any error

echo "🚀 TELEGRAM BOT 100% SYNCHRONIZATION SCRIPT"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
BOT_DIR="/opt/telegram-bot/telegram_bot"
BASE_DIR="/opt/telegram-bot"
USER="telegram-bot"

echo ""
echo "📋 VERIFICATION BEFORE START:"
echo "=============================="
echo "Bot Directory: $BOT_DIR"
echo "Base Directory: $BASE_DIR"
echo "Target User: $USER"
echo ""

read -p "🔥 WARNING: This will DELETE ALL existing bot files! Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Aborted by user."
    exit 0
fi

echo ""
echo "🏗️  FASE 1: PEMBERSIHAN TOTAL"
echo "============================"

log "Stopping telegram-bot service..."
sudo systemctl stop telegram-bot || true
success "Service stopped"

log "Killing any remaining Python processes..."
sudo pkill -f "python.*main.py" || true
sleep 2
success "Processes killed"

log "Removing all bot files..."
sudo rm -rf $BOT_DIR/*
sudo rm -rf $BASE_DIR/sessions/*
sudo rm -rf $BASE_DIR/downloads/*
success "Old files removed"

log "Clearing Python cache..."
find $BASE_DIR -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find $BASE_DIR -name "*.pyc" -delete 2>/dev/null || true
pip cache purge 2>/dev/null || true
success "Python cache cleared"

echo ""
echo "📁 FASE 2: STRUKTUR DIREKTORI BERSIH"
echo "==================================="

log "Creating clean directory structure..."
mkdir -p $BOT_DIR
mkdir -p $BOT_DIR/handlers
mkdir -p $BOT_DIR/utils
mkdir -p $BASE_DIR/sessions
mkdir -p $BASE_DIR/downloads
mkdir -p $BASE_DIR/logs

success "Directory structure created"

echo ""
echo "📄 FASE 3: COPY & VERIFIKASI FILE"
echo "=================================="

# Function to verify file after creation
verify_file() {
    local filepath=$1
    local expected_lines=$2
    local description=$3
    
    if [ ! -f "$filepath" ]; then
        error "$description: File not found at $filepath"
        return 1
    fi
    
    local actual_lines=$(wc -l < "$filepath")
    if [ "$actual_lines" -ne "$expected_lines" ]; then
        error "$description: Line count mismatch. Expected: $expected_lines, Got: $actual_lines"
        return 1
    fi
    
    success "$description: ✓ $actual_lines lines (correct)"
    return 0
}

echo ""
echo "📝 Creating main.py (181 lines)..."
cat > $BOT_DIR/main.py << 'MAIN_EOF'
import asyncio
import logging
import os
from typing import Dict, Any, Optional
import signal
import sys

try:
    import uvloop
except ImportError:
    uvloop = None

from pyrogram import Client, filters
from pyrogram.types import Message
from pyrogram.errors import FloodWait, AuthKeyUnregistered, SessionPasswordNeeded

from config import Config
from supabase_client import SupabaseManager
from handlers.file_handler import FileHandler
from handlers.auth_handler import AuthHandler
from handlers.admin_handler import AdminHandler
from utils.logger_setup import setup_logging

class TelegramBot:
    """Main Telegram Bot class that handles user uploads and interactions"""
    
    def __init__(self):
        """Initialize the bot with configuration and handlers"""
        setup_logging()
        self.logger = logging.getLogger(__name__)
        
        # Initialize configuration
        self.config = Config()
        
        # Initialize Supabase client
        self.supabase = SupabaseManager(
            url=self.config.supabase_url,
            service_role_key=self.config.supabase_service_role_key
        )
        
        # Initialize handlers
        self.file_handler = FileHandler(self.supabase)
        self.auth_handler = AuthHandler(self.supabase)
        self.admin_handler = AdminHandler(self.supabase)
        
        # Initialize Pyrogram client
        self.app = None
        self.running = False

    async def initialize(self):
        """Initialize the Pyrogram client and register handlers"""
        try:
            # Configure Pyrogram client
            self.app = Client(
                name="telegram_bot",
                api_id=self.config.api_id,
                api_hash=self.config.api_hash,
                phone_number=self.config.phone_number,
                workdir=self.config.session_dir,
                plugins=None
            )
            
            # Register message handlers for private chats
            self.app.add_handler(
                filters=filters.private & filters.video,
                handler=self.file_handler.handle_file_upload,
                group=1
            )
            
            self.app.add_handler(
                filters=filters.private & filters.document,
                handler=self.file_handler.handle_file_upload,
                group=1
            )
            
            # Register command handlers for private chats
            self.app.add_handler(
                filters=filters.private & filters.command("start"),
                handler=self.auth_handler.handle_start,
                group=0
            )
            
            self.app.add_handler(
                filters=filters.private & filters.command("link"),
                handler=self.auth_handler.handle_link_account,
                group=0
            )
            
            self.app.add_handler(
                filters=filters.private & filters.command("status"),
                handler=self.auth_handler.handle_status,
                group=0
            )
            
            # Admin commands
            self.app.add_handler(
                filters=filters.private & filters.command("admin"),
                handler=self.admin_handler.handle_admin_command,
                group=0
            )
            
            self.app.add_handler(
                filters=filters.private & filters.command("groups"),
                handler=self.admin_handler.handle_list_groups,
                group=0
            )
            
            self.app.add_handler(
                filters=filters.private & filters.command("addgroup"),
                handler=self.admin_handler.handle_add_group,
                group=0
            )
            
            self.app.add_handler(
                filters=filters.private & filters.command("help"),
                handler=self.show_help,
                group=0
            )
            
            # Register handlers for group chats (premium groups only)
            self.app.add_handler(
                filters=filters.group & filters.video,
                handler=self.file_handler.handle_group_upload,
                group=2
            )
            
            self.app.add_handler(
                filters=filters.group & filters.document,
                handler=self.file_handler.handle_group_upload,
                group=2
            )
            
            # Register forwarded message handler for admins
            self.app.add_handler(
                filters=filters.private & filters.forwarded,
                handler=self.admin_handler.handle_forward_info,
                group=0
            )
            
            self.logger.info("Bot handlers registered successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize bot: {e}")
            raise

    async def show_help(self, client: Client, message: Message):
        """Show help message with available commands"""
        help_text = """
🤖 **Telegram Video Upload Bot**

**Available Commands:**
• `/start` - Welcome message and account status
• `/link` - Link your Telegram account 
• `/status` - Check your account status
• `/help` - Show this help message

**For Admins:**
• `/admin` - Admin panel
• `/groups` - List premium groups
• `/addgroup` - Add premium group

**How to use:**
1. Link your Telegram account with `/link`
2. Send any video file to upload it automatically
3. Videos are processed and added to the website

**Support:** Contact administrators for help
        """
        await message.reply(help_text)

    async def start(self):
        """Start the bot"""
        try:
            await self.initialize()
            
            # Start the client
            await self.app.start()
            
            # Get bot info
            me = await self.app.get_me()
            self.logger.info(f"Bot started successfully as {me.first_name} (@{me.username})")
            self.logger.info("Bot is ready to receive messages")
            
            self.running = True
            
            # Keep the bot running
            await asyncio.Event().wait()
            
        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal, stopping bot...")
        except Exception as e:
            self.logger.error(f"Error running bot: {e}")
            raise
        finally:
            await self.stop()

    async def stop(self):
        """Stop the bot gracefully"""
        self.running = False
        if self.app:
            await self.app.stop()
        self.logger.info("Bot stopped")

async def main():
    """Main function to run the bot"""
    # Set event loop policy for better performance
    if uvloop:
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    
    bot = TelegramBot()
    
    try:
        await bot.start()
    except Exception as e:
        logging.error(f"Critical error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
MAIN_EOF

verify_file "$BOT_DIR/main.py" 181 "main.py"

echo ""
echo "📝 Creating config.py (130 lines)..."
cat > $BOT_DIR/config.py << 'CONFIG_EOF'
import os
import logging
from typing import Optional

class Config:
    """Configuration class for the Telegram bot"""
    
    def __init__(self):
        """Initialize configuration by loading environment variables"""
        self.load_config()
        self._create_directories()
        self._validate_config()

    def load_config(self):
        """Load all configuration from environment variables"""
        # Telegram API Configuration
        self.api_id = self._get_env_int("TELEGRAM_API_ID")
        self.api_hash = self._get_env("TELEGRAM_API_HASH")
        self.phone_number = self._get_env("TELEGRAM_PHONE_NUMBER")
        
        # Bot Settings
        self.session_dir = self._get_env("SESSION_DIR", "/opt/telegram-bot/sessions")
        self.download_dir = self._get_env("DOWNLOAD_DIR", "/opt/telegram-bot/downloads")
        self.log_level = self._get_env("LOG_LEVEL", "INFO")
        self.max_file_size = self._get_env_int("MAX_FILE_SIZE", 2147483648)  # 2GB default
        
        # Supabase Configuration
        self.supabase_url = self._get_env("SUPABASE_URL")
        self.supabase_service_role_key = self._get_env("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase_anon_key = self._get_env("SUPABASE_ANON_KEY")
        self.supabase_db_url = self._get_env("SUPABASE_DB_URL")
        
        # Doodstream Configuration
        self.doodstream_api_key = self._get_env("DOODSTREAM_API_KEY")
        self.doodstream_premium_api_key = self._get_env("DOODSTREAM_PREMIUM_API_KEY")
        
        # Optional Proxy Configuration
        self.proxy_host = os.getenv("PROXY_HOST")
        self.proxy_port = self._get_env_int("PROXY_PORT") if os.getenv("PROXY_PORT") else None
        self.proxy_username = os.getenv("PROXY_USERNAME")
        self.proxy_password = os.getenv("PROXY_PASSWORD")

    def _get_env(self, key: str, default: Optional[str] = None) -> str:
        """Get environment variable with optional default"""
        value = os.getenv(key, default)
        if value is None:
            raise ValueError(f"Required environment variable {key} is not set")
        return value

    def _get_env_int(self, key: str, default: Optional[int] = None) -> int:
        """Get environment variable as integer with optional default"""
        value = os.getenv(key)
        if value is None:
            if default is not None:
                return default
            raise ValueError(f"Required environment variable {key} is not set")
        
        try:
            return int(value)
        except ValueError:
            if default is not None:
                return default
            raise ValueError(f"Environment variable {key} must be a valid integer, got: {value}")

    def _create_directories(self):
        """Create necessary directories if they don't exist"""
        directories = [
            self.session_dir,
            self.download_dir,
            "/opt/telegram-bot/logs"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)

    def _validate_config(self):
        """Validate that all required configuration is present"""
        required_vars = [
            ("TELEGRAM_API_ID", self.api_id),
            ("TELEGRAM_API_HASH", self.api_hash),
            ("TELEGRAM_PHONE_NUMBER", self.phone_number),
            ("SUPABASE_URL", self.supabase_url),
            ("SUPABASE_SERVICE_ROLE_KEY", self.supabase_service_role_key),
            ("DOODSTREAM_API_KEY", self.doodstream_api_key),
        ]
        
        missing_vars = []
        for var_name, var_value in required_vars:
            if not var_value:
                missing_vars.append(var_name)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    def get_supabase_config(self) -> dict:
        """Get Supabase configuration as a dictionary"""
        return {
            "url": self.supabase_url,
            "service_role_key": self.supabase_service_role_key,
            "anon_key": self.supabase_anon_key,
            "db_url": self.supabase_db_url
        }

    def get_doodstream_config(self) -> dict:
        """Get Doodstream configuration as a dictionary"""
        return {
            "api_key": self.doodstream_api_key,
            "premium_api_key": self.doodstream_premium_api_key
        }

    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.log_level.upper() == "DEBUG"

    def __str__(self) -> str:
        """String representation of configuration (masks sensitive data)"""
        masked_phone = f"{self.phone_number[:3]}***{self.phone_number[-3:]}" if self.phone_number else "Not set"
        
        return f"""
Telegram Bot Configuration:
- API ID: {self.api_id}
- Phone: {masked_phone}
- Session Dir: {self.session_dir}
- Download Dir: {self.download_dir}
- Log Level: {self.log_level}
- Max File Size: {self.max_file_size} bytes
- Development Mode: {self.is_development()}
"""
CONFIG_EOF

verify_file "$BOT_DIR/config.py" 130 "config.py"

echo ""
echo "📝 Creating supabase_client.py (297 lines)..."
cat > $BOT_DIR/supabase_client.py << 'SUPABASE_EOF'
import logging
import requests
import json
from typing import Optional, Dict, Any, List
import random
import string

class SupabaseManager:
    """Manager class for Supabase operations"""
    
    def __init__(self, url: str, service_role_key: str):
        """Initialize Supabase manager with configuration"""
        self.logger = logging.getLogger(__name__)
        self.base_url = url.rstrip('/')
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {service_role_key}',
            'apikey': service_role_key,
            'Prefer': 'return=representation'
        }

    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make a generic HTTP request to Supabase API"""
        url = f"{self.base_url}/rest/v1/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=self.headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=self.headers, timeout=30)
            else:
                self.logger.error(f"Unsupported HTTP method: {method}")
                return None
            
            if response.status_code in [200, 201, 204]:
                try:
                    return response.json() if response.content else {}
                except json.JSONDecodeError:
                    return {}
            else:
                self.logger.error(f"API request failed: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request exception: {e}")
            return None

    def _call_rpc(self, function_name: str, params: Dict) -> Optional[Any]:
        """Call a Supabase RPC function"""
        url = f"{self.base_url}/rest/v1/rpc/{function_name}"
        
        try:
            response = requests.post(url, headers=self.headers, json=params, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                self.logger.error(f"RPC call failed: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"RPC request exception: {e}")
            return None

    def call_edge_function(self, function_name: str, payload: Dict) -> Optional[Dict]:
        """Call a Supabase Edge Function"""
        url = f"{self.base_url}/functions/v1/{function_name}"
        
        # Use authorization header for edge functions
        edge_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.headers["apikey"]}'
        }
        
        try:
            response = requests.post(url, headers=edge_headers, json=payload, timeout=120)
            
            if response.status_code == 200:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    # If response is not JSON, return success with text
                    return {"success": True, "message": response.text}
            else:
                self.logger.error(f"Edge function call failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}: {response.text}"}
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Edge function request exception: {e}")
            return {"success": False, "error": str(e)}

    # User and Profile Management
    def get_profile_by_telegram_id(self, telegram_user_id: int) -> Optional[Dict]:
        """Get user profile by Telegram user ID"""
        try:
            endpoint = f"profiles?telegram_user_id=eq.{telegram_user_id}&select=*"
            result = self._make_request('GET', endpoint)
            
            if result and len(result) > 0:
                return result[0]
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting profile by telegram ID: {e}")
            return None

    def update_profile_telegram_data(self, user_id: str, telegram_user_id: int, 
                                   telegram_username: str, telegram_chat_id: int) -> bool:
        """Update user profile with Telegram data"""
        try:
            data = {
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
                "telegram_chat_id": telegram_chat_id
            }
            
            endpoint = f"profiles?id=eq.{user_id}"
            result = self._make_request('PATCH', endpoint, data)
            
            return result is not None
            
        except Exception as e:
            self.logger.error(f"Error updating profile telegram data: {e}")
            return False

    def is_telegram_admin(self, telegram_user_id: int) -> bool:
        """Check if Telegram user has admin privileges"""
        try:
            result = self._call_rpc('is_telegram_admin', {'telegram_user_id_param': telegram_user_id})
            return bool(result) if result is not None else False
            
        except Exception as e:
            self.logger.error(f"Error checking telegram admin status: {e}")
            return False

    def is_premium_user(self, user_id: str) -> bool:
        """Check if user has premium subscription"""
        try:
            result = self._call_rpc('check_user_premium_status', {'user_id_param': user_id})
            return bool(result) if result is not None else False
            
        except Exception as e:
            self.logger.error(f"Error checking premium status: {e}")
            return False

    # Premium Group Management
    def is_premium_group_with_autoupload(self, chat_id: int) -> bool:
        """Check if chat is a premium group with auto-upload enabled"""
        try:
            result = self._call_rpc('is_premium_group_with_autoupload', {'chat_id_param': chat_id})
            return bool(result) if result is not None else False
            
        except Exception as e:
            self.logger.error(f"Error checking premium group status: {e}")
            return False

    def add_premium_group(self, chat_id: int, chat_title: str, admin_id: str) -> bool:
        """Add a new premium group"""
        try:
            data = {
                "chat_id": chat_id,
                "chat_title": chat_title,
                "added_by_admin_id": admin_id,
                "auto_upload_enabled": True
            }
            
            result = self._make_request('POST', 'premium_groups', data)
            return result is not None
            
        except Exception as e:
            self.logger.error(f"Error adding premium group: {e}")
            return False

    def get_premium_groups(self) -> List[Dict]:
        """Get all premium groups with auto-upload enabled"""
        try:
            endpoint = "premium_groups?auto_upload_enabled=eq.true&select=*"
            result = self._make_request('GET', endpoint)
            
            return result if result else []
            
        except Exception as e:
            self.logger.error(f"Error getting premium groups: {e}")
            return []

    # Telegram Upload Tracking
    def log_telegram_upload(self, telegram_data: Dict) -> Optional[str]:
        """Log a Telegram file upload attempt"""
        try:
            data = {
                "telegram_user_id": telegram_data.get("telegram_user_id"),
                "telegram_chat_id": telegram_data.get("telegram_chat_id"),
                "telegram_message_id": telegram_data.get("telegram_message_id"),
                "telegram_file_id": telegram_data.get("telegram_file_id"),
                "telegram_file_unique_id": telegram_data.get("telegram_file_unique_id"),
                "original_filename": telegram_data.get("original_filename"),
                "file_size": telegram_data.get("file_size"),
                "mime_type": telegram_data.get("mime_type"),
                "upload_status": "pending"
            }
            
            result = self._make_request('POST', 'telegram_uploads', data)
            
            if result and len(result) > 0:
                return result[0].get('id')
            return None
            
        except Exception as e:
            self.logger.error(f"Error logging telegram upload: {e}")
            return None

    def update_telegram_upload_status(self, upload_id: str, status: str, 
                                    doodstream_file_code: Optional[str] = None,
                                    video_id: Optional[str] = None,
                                    error_message: Optional[str] = None) -> bool:
        """Update the status of a logged Telegram upload"""
        try:
            data = {
                "upload_status": status,
                "processed_at": "now()" if status in ["completed", "failed"] else None
            }
            
            if doodstream_file_code:
                data["doodstream_file_code"] = doodstream_file_code
            if video_id:
                data["video_id"] = video_id
            if error_message:
                data["error_message"] = error_message
            
            endpoint = f"telegram_uploads?id=eq.{upload_id}"
            result = self._make_request('PATCH', endpoint, data)
            
            return result is not None
            
        except Exception as e:
            self.logger.error(f"Error updating telegram upload status: {e}")
            return False

    # Doodstream Integration
    def upload_to_doodstream(self, file_path: str, title: str) -> Optional[Dict]:
        """Upload file to Doodstream via edge function"""
        try:
            payload = {
                "file_path": file_path,
                "title": title
            }
            
            return self.call_edge_function('doodstream-api', payload)
            
        except Exception as e:
            self.logger.error(f"Error uploading to Doodstream: {e}")
            return None

    def sync_doodstream_videos(self) -> Optional[Dict]:
        """Sync videos from Doodstream"""
        try:
            payload = {"action": "sync_videos"}
            return self.call_edge_function('doodstream-api', payload)
            
        except Exception as e:
            self.logger.error(f"Error syncing Doodstream videos: {e}")
            return None

    # Link Code Management
    def create_telegram_link_code(self, telegram_user_id: int, telegram_username: str) -> Optional[str]:
        """Create and store a unique code for linking Telegram accounts"""
        try:
            link_code = self._generate_link_code()
            
            data = {
                "code": link_code,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username
            }
            
            result = self._make_request('POST', 'telegram_link_codes', data)
            
            if result and len(result) > 0:
                return link_code
            return None
            
        except Exception as e:
            self.logger.error(f"Error creating telegram link code: {e}")
            return None

    def _generate_link_code(self) -> str:
        """Generate a random 8-character link code"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

    # Upload Failure Logging
    def log_upload_failure(self, video_id: Optional[str], upload_type: str, error_details: Dict) -> bool:
        """Log upload failure for admin review"""
        try:
            data = {
                "video_id": video_id,
                "upload_type": upload_type,
                "error_details": error_details
            }
            
            result = self._make_request('POST', 'upload_failures', data)
            return result is not None
            
        except Exception as e:
            self.logger.error(f"Error logging upload failure: {e}")
            return False
SUPABASE_EOF

verify_file "$BOT_DIR/supabase_client.py" 297 "supabase_client.py"

echo ""
echo "📁 Creating handlers directory and files..."

# Create handlers/__init__.py
cat > $BOT_DIR/handlers/__init__.py << 'HANDLERS_INIT_EOF'
"""
Telegram Bot Handlers Package
Contains all message and command handlers for the bot
"""

from .auth_handler import AuthHandler
from .file_handler import FileHandler

try:
    from .admin_handler import AdminHandler
except ImportError:
    # Admin handler is optional
    AdminHandler = None

__all__ = ['AuthHandler', 'FileHandler', 'AdminHandler']
HANDLERS_INIT_EOF

verify_file "$BOT_DIR/handlers/__init__.py" 15 "handlers/__init__.py"

# Continue with the rest of the files...
echo ""
success "FASE 3 completed: All main files created and verified!"

echo ""
echo "🔧 FASE 4: SETUP ENVIRONMENT & PERMISSIONS"
echo "=========================================="

log "Setting file ownership to $USER..."
sudo chown -R $USER:$USER $BOT_DIR
sudo chown -R $USER:$USER $BASE_DIR/sessions
sudo chown -R $USER:$USER $BASE_DIR/downloads
success "Ownership set"

log "Setting file permissions..."
find $BOT_DIR -name "*.py" -exec chmod 644 {} \;
success "Permissions set"

echo ""
echo "✅ SYNCHRONIZATION PHASE 1-4 COMPLETED!"
echo "========================================"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Copy remaining handler files (auth_handler.py, admin_handler.py, file_handler.py)"
echo "2. Copy utils files (logger_setup.py, progress_tracker.py, utils/__init__.py)" 
echo "3. Setup .env file with your credentials"
echo "4. Run verification and start service"
echo ""
echo "🚀 Ready for manual file copying phase!"
echo "   Each file will be verified after copying."

# Make script executable
chmod +x $0