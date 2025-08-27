#!/bin/bash

# Complete Setup Script for Telegram User Bot
# This script automates the entire setup process

set -e  # Exit on any error

echo "🚀 TELEGRAM USER BOT COMPLETE DEPLOYMENT"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

echo "📋 Starting complete deployment process..."

# 1. Navigate to userbot directory
cd telegram_userbot || {
    echo "❌ telegram_userbot directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
}

# 2. Run the userbot setup script
echo "🔧 Running userbot setup script..."
chmod +x setup_userbot.sh
./setup_userbot.sh

# 3. Go back to project root and copy files
cd ..

echo "📁 Copying additional project files..."

# Copy environment template with project-specific values
cat > /opt/telegram-userbot/.env << 'ENV_EOF'
# Telegram User Bot Configuration
# IMPORTANT: Fill in these values before starting the bot!

# ==========================================
# TELEGRAM API CONFIGURATION (REQUIRED)
# ==========================================
# Get these from https://my.telegram.org/apps
# IMPORTANT: This is for USER BOT, NOT BotFather bot!
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_PHONE_NUMBER=+your_phone_number_here

# ==========================================
# SUPABASE CONFIGURATION (AUTO-CONFIGURED)
# ==========================================
SUPABASE_URL=https://agsqdznjjxptiyorljtv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnc3Fkem5qanhwdGl5b3JsanR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTAyMTcsImV4cCI6MjA3MTE4NjIxN30.P1KxrXpAB_Qr8vFdsw_dAT2__qgXEKWmqJur7k1NLL4

# ==========================================
# DOODSTREAM API KEYS (REQUIRED)
# ==========================================
DOODSTREAM_API_KEY=your_doodstream_api_key_here
DOODSTREAM_PREMIUM_API_KEY=your_premium_doodstream_api_key_here

# ==========================================
# BOT SETTINGS (CONFIGURED)
# ==========================================
SESSION_DIR=/opt/telegram-userbot/sessions
DOWNLOAD_DIR=/opt/telegram-userbot/downloads
LOG_LEVEL=INFO
MAX_FILE_SIZE=2147483648
ENV_EOF

chown telegram-userbot:telegram-userbot /opt/telegram-userbot/.env
chmod 600 /opt/telegram-userbot/.env

# 4. Create quick start guide
cat > /opt/telegram-userbot/QUICK_START.md << 'GUIDE_EOF'
# 📱 Telegram User Bot Quick Start Guide

## 🔧 Configuration Required

Before starting the bot, you MUST configure these values in `/opt/telegram-userbot/.env`:

### 1. Telegram API Credentials (REQUIRED)
```bash
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here  
TELEGRAM_PHONE_NUMBER=+628xxxxxxxxx
```

**How to get these:**
1. Go to https://my.telegram.org/apps
2. Login with your phone number
3. Create a new application
4. Copy API ID and API Hash
5. Use your phone number with country code

### 2. Supabase Service Role Key (REQUIRED)
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get this:**
1. Go to Supabase project settings
2. Go to API section
3. Copy the "service_role" key (NOT anon key)

### 3. Doodstream API Keys (REQUIRED)
```bash
DOODSTREAM_API_KEY=your_doodstream_api_key_here
DOODSTREAM_PREMIUM_API_KEY=your_premium_doodstream_api_key_here
```

**How to get these:**
1. Login to your Doodstream account
2. Go to API section in settings
3. Copy both regular and premium API keys

## 🚀 Starting the Bot

1. **Edit configuration:**
   ```bash
   sudo nano /opt/telegram-userbot/.env
   ```

2. **Test configuration:**
   ```bash
   cd /opt/telegram-userbot
   ./bot-test.sh
   ```

3. **Start the bot:**
   ```bash
   sudo systemctl start telegram-userbot
   ```

4. **Check status:**
   ```bash
   cd /opt/telegram-userbot
   ./bot-status.sh
   ```

5. **View logs:**
   ```bash
   cd /opt/telegram-userbot
   ./bot-logs.sh
   ```

## 📱 Using the Bot

### First Login
1. When you start the bot for the first time, it will ask for OTP
2. Check the logs: `./bot-logs.sh`
3. Enter the OTP code when prompted
4. The bot will create a session file for future logins

### Available Commands (send in private to the bot account)
- `/start` - Welcome message and bot info
- `/status` - Check bot status and recent uploads
- `/groups` - List premium groups
- `/addgroup <chat_id>` - Add a premium group
- `/sync` - Manually sync Doodstream videos
- `/link <code>` - Link Supabase account

### Adding Premium Groups
1. Add your user bot to the group as admin
2. Get the group chat ID (use bot like @userinfobot)
3. Send `/addgroup -1001234567890` to your bot
4. Files posted in that group will be auto-uploaded

## 🔍 Troubleshooting

### Bot won't start
- Check configuration: `./bot-test.sh`
- Check logs: `./bot-logs.sh`
- Verify API credentials are correct

### Authentication failed
- Verify phone number format (+628xxx)
- Check API ID and Hash are correct
- Make sure you're using USER API (not Bot API)

### Upload errors
- Check Doodstream API keys
- Verify Supabase connection
- Check file size limits (2GB max)

### Need Help?
- Check logs: `journalctl -u telegram-userbot -f`
- Restart bot: `systemctl restart telegram-userbot`
- Test config: `./bot-test.sh`

## ⚠️ Important Notes

- This is a USER BOT (uses your personal account)
- NOT a regular Telegram bot from BotFather
- Requires your phone number and OTP for first login
- Can join groups as a regular user
- No file size limitations like regular bots
- Auto-uploads videos from premium groups to Doodstream
- Videos appear on your website automatically
GUIDE_EOF

chown telegram-userbot:telegram-userbot /opt/telegram-userbot/QUICK_START.md

# 5. Create deployment summary
echo ""
echo "✅ TELEGRAM USER BOT DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "📁 Installation Directory: /opt/telegram-userbot"
echo "📝 Configuration File: /opt/telegram-userbot/.env"
echo "📖 Quick Start Guide: /opt/telegram-userbot/QUICK_START.md"
echo ""
echo "🔧 NEXT STEPS (REQUIRED):"
echo "1. Edit configuration file:"
echo "   sudo nano /opt/telegram-userbot/.env"
echo ""
echo "2. Fill in these REQUIRED values:"
echo "   • TELEGRAM_API_ID (from my.telegram.org)"
echo "   • TELEGRAM_API_HASH (from my.telegram.org)"
echo "   • TELEGRAM_PHONE_NUMBER (+628xxxxxxxxx)"
echo "   • SUPABASE_SERVICE_ROLE_KEY (from Supabase project)"
echo "   • DOODSTREAM_API_KEY (from Doodstream account)"
echo "   • DOODSTREAM_PREMIUM_API_KEY (from Doodstream account)"
echo ""
echo "3. Test configuration:"
echo "   cd /opt/telegram-userbot && ./bot-test.sh"
echo ""
echo "4. Start the bot:"
echo "   sudo systemctl start telegram-userbot"
echo ""
echo "5. Monitor first startup (for OTP input):"
echo "   cd /opt/telegram-userbot && ./bot-logs.sh"
echo ""
echo "🛠️ MANAGEMENT COMMANDS:"
echo "• Status: cd /opt/telegram-userbot && ./bot-status.sh"
echo "• Start: cd /opt/telegram-userbot && ./bot-start.sh"
echo "• Stop: cd /opt/telegram-userbot && ./bot-stop.sh"
echo "• Restart: cd /opt/telegram-userbot && ./bot-restart.sh"
echo "• Logs: cd /opt/telegram-userbot && ./bot-logs.sh"
echo "• Test: cd /opt/telegram-userbot && ./bot-test.sh"
echo ""
echo "⚡ IMPORTANT DIFFERENCES FROM BOT API:"
echo "• This is a USER BOT (uses your personal Telegram account)"
echo "• Requires API_ID + API_HASH from my.telegram.org (NOT BotFather)"
echo "• Uses your phone number for authentication"
echo "• First startup requires OTP verification"
echo "• Can join groups as a regular user"
echo "• No file size limits like regular bots"
echo "• Auto-uploads videos from premium groups to Doodstream"
echo ""
echo "📱 BOT FEATURES:"
echo "• Auto-upload videos from premium groups"
echo "• Dual upload to regular + premium Doodstream"
echo "• Automatic video processing and website integration"
echo "• Admin commands for group management"
echo "• Account linking with Supabase users"
echo "• Real-time upload status and notifications"
echo ""
echo "📖 Read the Quick Start Guide for detailed instructions:"
echo "   cat /opt/telegram-userbot/QUICK_START.md"
echo ""
echo "🎯 Ready to configure and start your Telegram User Bot!"