#!/bin/bash

# Complete Telegram Bot Setup Script
# This script sets up everything needed for the bot

set -e  # Exit on any error

echo "🤖 TELEGRAM BOT COMPLETE SETUP"
echo "================================"

# Check if running as root (needed for /opt directory)
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# 1. Create directories with proper permissions
echo "📁 Setting up directories..."
mkdir -p /opt/telegram-bot/{sessions,downloads,logs}
chown -R $SUDO_USER:$SUDO_USER /opt/telegram-bot
chmod -R 755 /opt/telegram-bot

# 2. Install system dependencies
echo "📦 Installing system dependencies..."
apt update
apt install -y python3 python3-pip python3-venv git curl

# 3. Create virtual environment
echo "🐍 Setting up Python virtual environment..."
cd /opt/telegram-bot
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install pyrogram tgcrypto requests asyncio uvloop python-dotenv

# 5. Copy bot files (assuming they're in current directory)
echo "📋 Copying bot files..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Copy all Python files and directories
cp -r "$SCRIPT_DIR"/*.py /opt/telegram-bot/ 2>/dev/null || true
cp -r "$SCRIPT_DIR"/handlers /opt/telegram-bot/ 2>/dev/null || true
cp -r "$SCRIPT_DIR"/utils /opt/telegram-bot/ 2>/dev/null || true
cp "$SCRIPT_DIR"/.env.template /opt/telegram-bot/ 2>/dev/null || true

# Set permissions
chown -R $SUDO_USER:$SUDO_USER /opt/telegram-bot
chmod +x /opt/telegram-bot/*.py

# 6. Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/telegram-bot.service << EOF
[Unit]
Description=Telegram Upload Bot
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=/opt/telegram-bot
Environment=PATH=/opt/telegram-bot/venv/bin
ExecStart=/opt/telegram-bot/venv/bin/python main.py
Restart=always
RestartSec=10

# Environment file
EnvironmentFile=-/opt/telegram-bot/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=telegram-bot

[Install]
WantedBy=multi-user.target
EOF

# 7. Create environment file template if it doesn't exist
if [ ! -f "/opt/telegram-bot/.env" ]; then
    echo "📝 Creating environment file template..."
    cp /opt/telegram-bot/.env.template /opt/telegram-bot/.env
    chown $SUDO_USER:$SUDO_USER /opt/telegram-bot/.env
    chmod 600 /opt/telegram-bot/.env
fi

# 8. Create management scripts
echo "🛠️ Creating management scripts..."

# Status script
cat > /opt/telegram-bot/bot-status.sh << 'EOF'
#!/bin/bash
echo "=== TELEGRAM BOT STATUS ==="
systemctl is-active telegram-bot
echo ""
echo "=== RECENT LOGS ==="
journalctl -u telegram-bot -n 20 --no-pager
EOF

# Start script
cat > /opt/telegram-bot/bot-start.sh << 'EOF'
#!/bin/bash
echo "Starting Telegram Bot..."
systemctl start telegram-bot
systemctl status telegram-bot
EOF

# Stop script
cat > /opt/telegram-bot/bot-stop.sh << 'EOF'
#!/bin/bash
echo "Stopping Telegram Bot..."
systemctl stop telegram-bot
systemctl status telegram-bot
EOF

# Restart script
cat > /opt/telegram-bot/bot-restart.sh << 'EOF'
#!/bin/bash
echo "Restarting Telegram Bot..."
systemctl restart telegram-bot
systemctl status telegram-bot
EOF

# Logs script
cat > /opt/telegram-bot/bot-logs.sh << 'EOF'
#!/bin/bash
echo "=== LIVE TELEGRAM BOT LOGS ==="
echo "Press Ctrl+C to exit"
journalctl -u telegram-bot -f
EOF

# Diagnostic script
cat > /opt/telegram-bot/bot-diagnostic.sh << 'EOF'
#!/bin/bash
cd /opt/telegram-bot
source venv/bin/activate
python3 debug_full_system.py
EOF

# Make scripts executable
chmod +x /opt/telegram-bot/bot-*.sh

# Set ownership
chown -R $SUDO_USER:$SUDO_USER /opt/telegram-bot

# 9. Reload systemd
systemctl daemon-reload

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Edit /opt/telegram-bot/.env with your actual API credentials"
echo "2. Run diagnostic: cd /opt/telegram-bot && ./bot-diagnostic.sh"
echo "3. Start bot: sudo systemctl start telegram-bot"
echo ""
echo "🛠️ MANAGEMENT COMMANDS:"
echo "• Status: ./bot-status.sh"
echo "• Start:  ./bot-start.sh" 
echo "• Stop:   ./bot-stop.sh"
echo "• Restart: ./bot-restart.sh"
echo "• Logs:   ./bot-logs.sh"
echo "• Test:   ./bot-diagnostic.sh"
echo ""
echo "📁 Bot files are in: /opt/telegram-bot"
echo "📝 Edit config: /opt/telegram-bot/.env"
echo ""
echo "⚠️  IMPORTANT: Configure your .env file before starting!"