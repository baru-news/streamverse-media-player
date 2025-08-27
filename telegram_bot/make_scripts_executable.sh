#!/bin/bash
# Make all verification and fix scripts executable

echo "🔧 Making scripts executable..."

chmod +x /opt/telegram-bot/telegram_bot/full_verify_and_fix.sh
chmod +x /opt/telegram-bot/telegram_bot/emergency_full_recopy.sh  
chmod +x /opt/telegram-bot/telegram_bot/final_setup_after_copy.sh
chmod +x /opt/telegram-bot/telegram_bot/make_scripts_executable.sh

echo "✅ All scripts are now executable!"
echo ""
echo "🚀 READY TO START! Run this command:"
echo "/opt/telegram-bot/telegram_bot/full_verify_and_fix.sh"