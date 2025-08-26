#!/bin/bash
# Complete cleanup and restart script

echo "🛑 Stopping telegram-bot service..."
sudo systemctl stop telegram-bot

echo "🧹 Complete Python cache cleanup..."
# Remove all __pycache__ directories recursively
find /opt/telegram-bot -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove all .pyc files
find /opt/telegram-bot -name "*.pyc" -delete 2>/dev/null || true

# Remove all .pyo files  
find /opt/telegram-bot -name "*.pyo" -delete 2>/dev/null || true

# Clear pip cache
pip cache purge 2>/dev/null || true

# Clear any temp files
rm -rf /opt/telegram-bot/downloads/* 2>/dev/null || true
rm -rf /opt/telegram-bot/sessions/* 2>/dev/null || true

# Clear system Python cache
python3 -Bc "import py_compile; py_compile.compile('/dev/null')" 2>/dev/null || true

echo "🔍 Verifying SupabaseManager constructor..."
grep -n "def __init__" /opt/telegram-bot/telegram_bot/supabase_client.py

echo "🔍 Checking for any remaining SupabaseManager calls with arguments..."
grep -rn "SupabaseManager(" /opt/telegram-bot/telegram_bot/ || echo "No matches found"

echo "✅ Cleanup complete!"
echo ""
echo "🚀 Starting telegram-bot service..."
sudo systemctl start telegram-bot

echo "📊 Checking service status..."
sudo systemctl status telegram-bot --no-pager

echo ""
echo "📋 Following logs (press Ctrl+C to stop)..."
sudo journalctl -u telegram-bot -f