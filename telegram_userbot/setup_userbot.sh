#!/bin/bash

# Complete Telegram User Bot Setup Script
# This script sets up everything needed for the user bot

set -e  # Exit on any error

echo "🤖 TELEGRAM USER BOT COMPLETE SETUP"
echo "===================================="

# Check if running as root (needed for /opt directory)
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# 1. Create user and directories with proper permissions
echo "📁 Setting up user and directories..."
useradd -r -s /bin/false telegram-userbot 2>/dev/null || true
mkdir -p /opt/telegram-userbot/{sessions,downloads,logs}
chown -R telegram-userbot:telegram-userbot /opt/telegram-userbot
chmod -R 755 /opt/telegram-userbot

# 2. Install system dependencies
echo "📦 Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv git curl

# 3. Create virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /opt/telegram-userbot
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install pyrogram tgcrypto supabase httpx aiofiles python-dotenv uvloop python-json-logger

# 5. Copy bot files
echo "📋 Copying bot files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Copy all Python files and directories
cp -r "$SCRIPT_DIR"/*.py /opt/telegram-userbot/ 2>/dev/null || true
cp -r "$SCRIPT_DIR"/handlers /opt/telegram-userbot/ 2>/dev/null || true
cp -r "$SCRIPT_DIR"/utils /opt/telegram-userbot/ 2>/dev/null || true
cp "$SCRIPT_DIR"/.env.template /opt/telegram-userbot/ 2>/dev/null || true
cp "$SCRIPT_DIR"/requirements.txt /opt/telegram-userbot/ 2>/dev/null || true

# Set permissions
chown -R telegram-userbot:telegram-userbot /opt/telegram-userbot
chmod +x /opt/telegram-userbot/*.py

# 6. Create systemd service
echo "🔧 Creating systemd service..."
cp "$SCRIPT_DIR"/systemd/telegram-userbot.service /etc/systemd/system/

# 7. Create environment file template if it doesn't exist
if [ ! -f "/opt/telegram-userbot/.env" ]; then
    echo "📝 Creating environment file template..."
    cp /opt/telegram-userbot/.env.template /opt/telegram-userbot/.env
    chown telegram-userbot:telegram-userbot /opt/telegram-userbot/.env
    chmod 600 /opt/telegram-userbot/.env
fi

# 8. Create management scripts
echo "🛠️ Creating management scripts..."

# Status script
cat > /opt/telegram-userbot/bot-status.sh << 'EOF'
#!/bin/bash
echo "=== TELEGRAM USER BOT STATUS ==="
systemctl is-active telegram-userbot
echo ""
echo "=== RECENT LOGS ==="
journalctl -u telegram-userbot -n 20 --no-pager
EOF

# Start script
cat > /opt/telegram-userbot/bot-start.sh << 'EOF'
#!/bin/bash
echo "Starting Telegram User Bot..."
systemctl start telegram-userbot
systemctl status telegram-userbot --no-pager
EOF

# Stop script
cat > /opt/telegram-userbot/bot-stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Telegram User Bot..."
systemctl stop telegram-userbot
systemctl status telegram-userbot --no-pager
EOF

# Restart script
cat > /opt/telegram-userbot/bot-restart.sh << 'EOF'
#!/bin/bash
echo "Restarting Telegram User Bot..."
systemctl restart telegram-userbot
systemctl status telegram-userbot --no-pager
EOF

# Logs script
cat > /opt/telegram-userbot/bot-logs.sh << 'EOF'
#!/bin/bash
echo "=== LIVE TELEGRAM USER BOT LOGS ==="
echo "Press Ctrl+C to exit"
journalctl -u telegram-userbot -f
EOF

# Test script
cat > /opt/telegram-userbot/bot-test.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Telegram User Bot Configuration..."
cd /opt/telegram-userbot
source venv/bin/activate

echo "1. Checking Python environment..."
python3 --version

echo "2. Checking required packages..."
python3 -c "import pyrogram; print('✅ Pyrogram installed')"
python3 -c "import supabase; print('✅ Supabase installed')" 
python3 -c "import tgcrypto; print('✅ TgCrypto installed')"

echo "3. Checking configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "TELEGRAM_API_ID=your_api_id_here" .env; then
        echo "⚠️  .env file needs to be configured"
    else
        echo "✅ .env file appears configured"
    fi
else
    echo "❌ .env file missing"
fi

echo "4. Checking file structure..."
[ -f "main.py" ] && echo "✅ main.py found" || echo "❌ main.py missing"
[ -d "handlers" ] && echo "✅ handlers directory found" || echo "❌ handlers directory missing"
[ -d "utils" ] && echo "✅ utils directory found" || echo "❌ utils directory missing"
[ -d "sessions" ] && echo "✅ sessions directory found" || echo "❌ sessions directory missing"

echo ""
echo "🔧 To complete setup:"
echo "1. Edit /opt/telegram-userbot/.env with your credentials"
echo "2. Run: sudo systemctl start telegram-userbot"
echo "3. Check logs: sudo journalctl -u telegram-userbot -f"
EOF

# Make scripts executable
chmod +x /opt/telegram-userbot/bot-*.sh

# Set ownership
chown -R telegram-userbot:telegram-userbot /opt/telegram-userbot

# 9. Reload systemd
systemctl daemon-reload

echo ""
echo "✅ TELEGRAM USER BOT SETUP COMPLETE!"
echo "====================================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Edit /opt/telegram-userbot/.env with your API credentials"
echo "2. Test configuration: cd /opt/telegram-userbot && ./bot-test.sh"
echo "3. Start bot: sudo systemctl start telegram-userbot"
echo ""
echo "🛠️ MANAGEMENT COMMANDS:"
echo "• Status: ./bot-status.sh"
echo "• Start:  ./bot-start.sh" 
echo "• Stop:   ./bot-stop.sh"
echo "• Restart: ./bot-restart.sh"
echo "• Logs:   ./bot-logs.sh"
echo "• Test:   ./bot-test.sh"
echo ""
echo "📁 Bot files are in: /opt/telegram-userbot"
echo "📝 Edit config: /opt/telegram-userbot/.env"
echo ""
echo "⚠️  IMPORTANT DIFFERENCES FROM BOT API:"
echo "• This is a USER BOT (uses your personal Telegram account)"
echo "• Requires API_ID + API_HASH from my.telegram.org (not BotFather)"
echo "• Uses your phone number for authentication"
echo "• Can join groups as a regular user"
echo "• No file size limits like regular bots"
echo ""
echo "🔑 REQUIRED CREDENTIALS:"
echo "• TELEGRAM_API_ID (from my.telegram.org)"
echo "• TELEGRAM_API_HASH (from my.telegram.org)"  
echo "• TELEGRAM_PHONE_NUMBER (with country code: +628xxxx)"
echo "• SUPABASE_SERVICE_ROLE_KEY"
echo "• DOODSTREAM_API_KEY"