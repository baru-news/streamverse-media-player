#!/bin/bash
# Script to restart the Telegram Bot service

echo "🔄 Restarting Telegram Bot service..."

# Stop the service
echo "⏹️  Stopping telegram-bot service..."
sudo systemctl stop telegram-bot

# Wait a moment
sleep 2

# Start the service
echo "▶️  Starting telegram-bot service..."
sudo systemctl start telegram-bot

# Check status
echo "📊 Checking service status..."
sudo systemctl status telegram-bot --no-pager

echo ""
echo "🔍 Recent logs:"
sudo journalctl -u telegram-bot -n 10 --no-pager

echo ""
echo "✅ Bot restart complete!"
echo "💡 To monitor logs: sudo journalctl -u telegram-bot -f"