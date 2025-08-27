#!/bin/bash
# Emergency Full File Re-copy Script
# Use this if verification script doesn't fix the issues

echo "🚨 EMERGENCY FULL FILE RE-COPY PROCEDURE"
echo "========================================"
echo ""
echo "⚠️  WARNING: This will overwrite ALL bot files!"
echo "    Make sure you have the correct files ready to copy."
echo ""
read -p "Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "⏹️  Stopping service..."
sudo systemctl stop telegram-bot

echo ""
echo "📁 STEP 1: Create backup of current files..."
BACKUP_DIR="/opt/telegram-bot/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /opt/telegram-bot/telegram_bot "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"

echo ""
echo "🗑️  STEP 2: Clear existing files..."
rm -rf /opt/telegram-bot/telegram_bot/*

echo ""
echo "📝 STEP 3: Ready for file copy..."
echo "=================================="
echo ""
echo "NOW COPY THESE FILES IN ORDER:"
echo ""
echo "1️⃣  MAIN FILES:"
echo "   - Copy main.py to /opt/telegram-bot/telegram_bot/"
echo "   - Copy config.py to /opt/telegram-bot/telegram_bot/"
echo ""
echo "2️⃣  SUPABASE CLIENT:"
echo "   - Copy supabase_client.py to /opt/telegram-bot/telegram_bot/"
echo ""
echo "3️⃣  HANDLERS DIRECTORY:"
echo "   - Create: mkdir -p /opt/telegram-bot/telegram_bot/handlers"
echo "   - Copy auth_handler.py to /opt/telegram-bot/telegram_bot/handlers/"
echo "   - Copy admin_handler.py to /opt/telegram-bot/telegram_bot/handlers/"
echo "   - Copy file_handler.py to /opt/telegram-bot/telegram_bot/handlers/"
echo "   - Copy __init__.py to /opt/telegram-bot/telegram_bot/handlers/"
echo ""
echo "4️⃣  UTILS DIRECTORY:"
echo "   - Create: mkdir -p /opt/telegram-bot/telegram_bot/utils"  
echo "   - Copy logger_setup.py to /opt/telegram-bot/telegram_bot/utils/"
echo "   - Copy progress_tracker.py to /opt/telegram-bot/telegram_bot/utils/"
echo "   - Copy __init__.py to /opt/telegram-bot/telegram_bot/utils/"
echo ""
echo "5️⃣  AFTER COPYING ALL FILES, RUN:"
echo "   chmod +x /opt/telegram-bot/telegram_bot/final_setup_after_copy.sh"
echo "   /opt/telegram-bot/telegram_bot/final_setup_after_copy.sh"
echo ""
echo "Press any key when you're ready to start copying files..."
read -p ""

# Create the directories
mkdir -p /opt/telegram-bot/telegram_bot/handlers
mkdir -p /opt/telegram-bot/telegram_bot/utils

echo "✅ Directories created. Ready for file copy!"
echo ""
echo "🔄 Start copying files now..."