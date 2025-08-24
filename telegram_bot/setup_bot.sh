#!/bin/bash

# Setup script for Telegram Bot deployment
# This script configures the bot for production use

set -e

echo "🤖 Setting up Telegram Bot for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_USER="telegram-bot"
BOT_DIR="/opt/telegram-bot"
VENV_DIR="$BOT_DIR/venv"
SYSTEMD_DIR="/etc/systemd/system"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   exit 1
fi

echo -e "${BLUE}📋 Checking system requirements...${NC}"

# Check if user exists
if ! id "$BOT_USER" &>/dev/null; then
    echo -e "${RED}❌ User $BOT_USER does not exist${NC}"
    echo -e "${YELLOW}💡 Please run the basic_setup.sh script first${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}❌ Virtual environment not found at $VENV_DIR${NC}"
    echo -e "${YELLOW}💡 Please run the python_setup.sh script first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System requirements check passed${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating bot directories...${NC}"
mkdir -p "$BOT_DIR/sessions"
mkdir -p "$BOT_DIR/downloads" 
mkdir -p "$BOT_DIR/logs"

# Set proper ownership and permissions
chown -R $BOT_USER:$BOT_USER "$BOT_DIR"
chmod -R 755 "$BOT_DIR"
chmod 700 "$BOT_DIR/sessions"  # Secure session files
chmod 755 "$BOT_DIR/downloads"
chmod 755 "$BOT_DIR/logs"

echo -e "${GREEN}✅ Directories created with proper permissions${NC}"

# Install systemd service
echo -e "${BLUE}⚙️ Installing systemd service...${NC}"
cp "$BOT_DIR/telegram_bot/systemd/telegram-bot.service" "$SYSTEMD_DIR/"
systemctl daemon-reload

echo -e "${GREEN}✅ Systemd service installed${NC}"

# Create environment file template
echo -e "${BLUE}📝 Creating environment configuration...${NC}"
ENV_FILE="$BOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# Telegram Bot Configuration
# Copy this template and fill in your values

# Telegram API Credentials (get from https://my.telegram.org)
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_PHONE_NUMBER=your_phone_number_here

# Bot Settings
LOG_LEVEL=INFO
MAX_FILE_SIZE=2147483648
SESSION_DIR=/opt/telegram-bot/sessions
DOWNLOAD_DIR=/opt/telegram-bot/downloads

# Supabase Configuration
SUPABASE_URL=https://agsqdznjjxptiyorljtv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Doodstream API Keys
DOODSTREAM_API_KEY=your_doodstream_api_key_here
DOODSTREAM_PREMIUM_API_KEY=your_doodstream_premium_api_key_here
EOF

    chown $BOT_USER:$BOT_USER "$ENV_FILE"
    chmod 600 "$ENV_FILE"  # Secure environment file
    
    echo -e "${GREEN}✅ Environment file created at $ENV_FILE${NC}"
    echo -e "${YELLOW}⚠️  Please edit $ENV_FILE and add your configuration${NC}"
else
    echo -e "${YELLOW}⚠️  Environment file already exists at $ENV_FILE${NC}"
fi

# Create bot management scripts
echo -e "${BLUE}📜 Creating management scripts...${NC}"

# Start script
cat > "$BOT_DIR/start_bot.sh" << 'EOF'
#!/bin/bash
echo "🚀 Starting Telegram Bot..."
sudo systemctl start telegram-bot
sudo systemctl status telegram-bot --no-pager
EOF

# Stop script  
cat > "$BOT_DIR/stop_bot.sh" << 'EOF'
#!/bin/bash
echo "🛑 Stopping Telegram Bot..."
sudo systemctl stop telegram-bot
echo "✅ Bot stopped"
EOF

# Status script
cat > "$BOT_DIR/status_bot.sh" << 'EOF'
#!/bin/bash
echo "📊 Telegram Bot Status:"
sudo systemctl status telegram-bot --no-pager
echo
echo "📜 Recent logs:"
sudo journalctl -u telegram-bot --no-pager -n 20
EOF

# Logs script
cat > "$BOT_DIR/logs_bot.sh" << 'EOF'
#!/bin/bash
echo "📜 Following Telegram Bot logs (Ctrl+C to exit):"
sudo journalctl -u telegram-bot -f
EOF

# Make scripts executable
chmod +x "$BOT_DIR"/*.sh
chown $BOT_USER:$BOT_USER "$BOT_DIR"/*.sh

echo -e "${GREEN}✅ Management scripts created${NC}"

# Create configuration check script
cat > "$BOT_DIR/check_config.py" << 'EOF'
#!/usr/bin/env python3
"""
Configuration checker for Telegram Bot
Validates all required settings before starting
"""

import os
import sys
from pathlib import Path

def check_env_var(name, required=True):
    """Check if environment variable is set"""
    value = os.getenv(name)
    if required and not value:
        print(f"❌ Missing required environment variable: {name}")
        return False
    elif value:
        print(f"✅ {name}: {'*' * min(len(value), 10)}")
        return True
    else:
        print(f"⚠️  Optional variable {name}: Not set")
        return True

def check_directory(path, description):
    """Check if directory exists and is writable"""
    if Path(path).exists() and os.access(path, os.W_OK):
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ {description}: {path} (not accessible)")
        return False

def main():
    print("🔍 Checking Telegram Bot configuration...\n")
    
    # Load environment file
    env_file = Path("/opt/telegram-bot/.env")
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print("📄 Loaded environment from .env file")
    else:
        print("⚠️  No .env file found")
    
    print("\n📋 Environment Variables:")
    all_good = True
    
    # Required variables
    required_vars = [
        "TELEGRAM_API_ID",
        "TELEGRAM_API_HASH", 
        "TELEGRAM_PHONE_NUMBER",
        "SUPABASE_SERVICE_ROLE_KEY",
        "DOODSTREAM_API_KEY"
    ]
    
    for var in required_vars:
        if not check_env_var(var):
            all_good = False
    
    # Optional variables
    optional_vars = [
        "SUPABASE_ANON_KEY",
        "DOODSTREAM_PREMIUM_API_KEY"
    ]
    
    for var in optional_vars:
        check_env_var(var, required=False)
    
    print("\n📁 Directory Access:")
    directories = [
        ("/opt/telegram-bot/sessions", "Sessions directory"),
        ("/opt/telegram-bot/downloads", "Downloads directory"),
        ("/opt/telegram-bot/logs", "Logs directory")
    ]
    
    for path, desc in directories:
        if not check_directory(path, desc):
            all_good = False
    
    print(f"\n{'🎉 Configuration looks good!' if all_good else '❌ Configuration has issues'}")
    return 0 if all_good else 1

if __name__ == "__main__":
    sys.exit(main())
EOF

chmod +x "$BOT_DIR/check_config.py"
chown $BOT_USER:$BOT_USER "$BOT_DIR/check_config.py"

echo -e "${GREEN}✅ Configuration checker created${NC}"

# Final instructions
echo -e "\n${GREEN}🎉 Telegram Bot setup completed!${NC}"
echo -e "\n${BLUE}📋 Next steps:${NC}"
echo -e "1. Edit configuration: ${YELLOW}nano $ENV_FILE${NC}"
echo -e "2. Check configuration: ${YELLOW}$BOT_DIR/check_config.py${NC}"
echo -e "3. Start the bot: ${YELLOW}$BOT_DIR/start_bot.sh${NC}"
echo -e "4. Check status: ${YELLOW}$BOT_DIR/status_bot.sh${NC}"
echo -e "5. View logs: ${YELLOW}$BOT_DIR/logs_bot.sh${NC}"

echo -e "\n${BLUE}🔧 Management Commands:${NC}"
echo -e "• Enable auto-start: ${YELLOW}sudo systemctl enable telegram-bot${NC}"
echo -e "• Disable auto-start: ${YELLOW}sudo systemctl disable telegram-bot${NC}"
echo -e "• Restart bot: ${YELLOW}sudo systemctl restart telegram-bot${NC}"

echo -e "\n${YELLOW}⚠️  Important:${NC}"
echo -e "• Add your Telegram API credentials to $ENV_FILE"
echo -e "• Make sure Supabase keys are properly configured"
echo -e "• Test the bot configuration before enabling auto-start"
echo -e "• Monitor logs for any authentication or connection issues"

echo -e "\n${GREEN}✅ Setup complete! The bot is ready for configuration.${NC}"