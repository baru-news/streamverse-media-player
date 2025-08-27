#!/bin/bash
# Comprehensive Bot Verification and Fix Script
# This script verifies files, clears cache, and restarts the bot

echo "🔍 STEP 1: Verifying supabase_client.py file integrity..."
echo "=========================================================="

# Check if file exists and get line count
if [ -f "/opt/telegram-bot/telegram_bot/supabase_client.py" ]; then
    LINE_COUNT=$(wc -l < /opt/telegram-bot/telegram_bot/supabase_client.py)
    echo "✅ File exists with $LINE_COUNT lines"
    
    if [ "$LINE_COUNT" -lt 290 ]; then
        echo "❌ ERROR: File too short ($LINE_COUNT lines), should be 290+ lines"
        echo "🚨 File may be corrupted or incomplete!"
    else
        echo "✅ File length looks correct"
    fi
else
    echo "❌ ERROR: supabase_client.py file not found!"
    exit 1
fi

# Check for critical methods
echo ""
echo "🔍 Checking for required methods..."
METHODS_TO_CHECK=(
    "create_link_code"
    "is_user_admin" 
    "create_telegram_link_code"
    "is_telegram_admin"
    "get_profile_by_telegram_id"
)

for method in "${METHODS_TO_CHECK[@]}"; do
    if grep -q "def $method" /opt/telegram-bot/telegram_bot/supabase_client.py; then
        echo "✅ Method '$method' found"
    else
        echo "❌ Method '$method' NOT found"
    fi
done

echo ""
echo "🧹 STEP 2: Comprehensive Cache Cleanup..."
echo "=========================================="

# Stop the service first
echo "⏹️  Stopping telegram-bot service..."
sudo systemctl stop telegram-bot

# Wait for service to fully stop
sleep 3

# Remove all __pycache__ directories recursively
echo "🗑️  Removing __pycache__ directories..."
find /opt/telegram-bot -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove all .pyc files
echo "🗑️  Removing .pyc files..."
find /opt/telegram-bot -name "*.pyc" -delete 2>/dev/null || true

# Remove all .pyo files  
echo "🗑️  Removing .pyo files..."
find /opt/telegram-bot -name "*.pyo" -delete 2>/dev/null || true

# Clear pip cache
echo "🧹 Clearing pip cache..."
pip cache purge 2>/dev/null || true

# Clear any temp/session files
echo "🗑️  Clearing temp and session files..."
rm -rf /opt/telegram-bot/downloads/* 2>/dev/null || true
rm -rf /opt/telegram-bot/sessions/* 2>/dev/null || true

# Clear system Python cache
python3 -Bc "import py_compile; py_compile.compile('/dev/null')" 2>/dev/null || true

echo "✅ Cache cleanup completed!"

echo ""
echo "🚀 STEP 3: Restarting Service with Monitoring..."
echo "==============================================="

# Start the service
echo "▶️  Starting telegram-bot service..."
sudo systemctl start telegram-bot

# Wait for startup
sleep 5

# Check service status
echo "📊 Service Status:"
sudo systemctl status telegram-bot --no-pager

echo ""
echo "📋 STEP 4: Real-time Log Monitoring..."
echo "======================================"
echo "Showing last 15 lines and then following logs..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Show recent logs and follow
sudo journalctl -u telegram-bot -n 15 --no-pager
echo ""
echo "🔄 Following live logs (Press Ctrl+C to stop):"
sudo journalctl -u telegram-bot -f

echo ""
echo "✅ Verification and restart complete!"
echo ""
echo "🧪 TESTING INSTRUCTIONS:"
echo "========================"
echo "1. Open Telegram and find your bot"
echo "2. Test command: /link"
echo "3. Test command: /admin (if you're admin)"
echo "4. Test command: /status"
echo ""
echo "❓ If you still get 'object has no attribute' errors:"
echo "   Run: /opt/telegram-bot/telegram_bot/emergency_full_recopy.sh"