#!/bin/bash
# Final Setup Script - Run after copying all files

echo "🔧 FINAL SETUP AFTER FILE COPY"
echo "==============================="

echo ""
echo "📊 STEP 1: Verifying all files exist..."

# Check main files
MAIN_FILES=(
    "/opt/telegram-bot/telegram_bot/main.py"
    "/opt/telegram-bot/telegram_bot/config.py" 
    "/opt/telegram-bot/telegram_bot/supabase_client.py"
)

for file in "${MAIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $(basename $file) exists"
    else
        echo "❌ $(basename $file) MISSING!"
    fi
done

# Check handler files
HANDLER_FILES=(
    "/opt/telegram-bot/telegram_bot/handlers/__init__.py"
    "/opt/telegram-bot/telegram_bot/handlers/auth_handler.py"
    "/opt/telegram-bot/telegram_bot/handlers/admin_handler.py"
    "/opt/telegram-bot/telegram_bot/handlers/file_handler.py"
)

for file in "${HANDLER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ handlers/$(basename $file) exists"
    else
        echo "❌ handlers/$(basename $file) MISSING!"
    fi
done

# Check utils files  
UTILS_FILES=(
    "/opt/telegram-bot/telegram_bot/utils/__init__.py"
    "/opt/telegram-bot/telegram_bot/utils/logger_setup.py"
    "/opt/telegram-bot/telegram_bot/utils/progress_tracker.py"
)

for file in "${UTILS_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ utils/$(basename $file) exists"
    else
        echo "❌ utils/$(basename $file) MISSING!"
    fi
done

echo ""
echo "🔒 STEP 2: Setting file permissions..."
chown -R telegram-bot:telegram-bot /opt/telegram-bot/telegram_bot/
chmod 644 /opt/telegram-bot/telegram_bot/*.py
chmod 644 /opt/telegram-bot/telegram_bot/handlers/*.py  
chmod 644 /opt/telegram-bot/telegram_bot/utils/*.py

echo ""
echo "🧹 STEP 3: Clearing any cache..."
find /opt/telegram-bot -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find /opt/telegram-bot -name "*.pyc" -delete 2>/dev/null || true

echo ""
echo "🚀 STEP 4: Starting the bot..."
sudo systemctl start telegram-bot

sleep 5

echo ""
echo "📊 STEP 5: Checking status..."
sudo systemctl status telegram-bot --no-pager

echo ""
echo "📋 Recent logs:"
sudo journalctl -u telegram-bot -n 10 --no-pager

echo ""
echo "✅ Setup complete!"
echo ""
echo "🧪 TEST YOUR BOT NOW:"
echo "===================="
echo "1. Send /link to your bot"
echo "2. Send /admin to your bot"
echo "3. Send /status to your bot"
echo ""
echo "📋 To monitor logs: sudo journalctl -u telegram-bot -f"