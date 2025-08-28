#!/bin/bash

# Complete VPS Setup Script - Runs all setup scripts in order
# Run this script as root: bash complete_setup.sh

set -e

echo "========================================"
echo "  TELEGRAM BOT VPS COMPLETE SETUP"
echo "========================================"
echo ""

# Function to print status
print_status() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_status "Starting complete VPS setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root"
    echo "   Run: sudo bash complete_setup.sh"
    exit 1
fi

# Run pre-check
print_status "Running pre-setup check..."
if [ -f "scripts/setup_precheck.sh" ]; then
    bash scripts/setup_precheck.sh
else
    echo "⚠️  Warning: Pre-check script not found, continuing anyway..."
fi

echo ""
print_status "========== PHASE 1: BASIC SETUP =========="
if bash scripts/basic_setup.sh; then
    print_status "✅ Basic setup completed successfully"
else
    print_status "❌ Basic setup failed"
    exit 1
fi

echo ""
print_status "========== PHASE 2: SECURITY SETUP =========="
if bash scripts/security_setup.sh; then
    print_status "✅ Security setup completed successfully"
else
    print_status "❌ Security setup failed"
    exit 1
fi

echo ""
print_status "========== PHASE 3: PYTHON ENVIRONMENT =========="
if bash scripts/python_setup.sh; then
    print_status "✅ Python environment setup completed successfully"
else
    print_status "❌ Python environment setup failed"
    exit 1
fi

echo ""
print_status "========== PHASE 4: BOT ENVIRONMENT =========="
if bash scripts/bot_environment.sh; then
    print_status "✅ Bot environment setup completed successfully"
else
    print_status "❌ Bot environment setup failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "    🎉 COMPLETE SETUP FINISHED! 🎉"
echo "=========================================="
echo ""
print_status "All setup phases completed successfully!"
echo ""
echo "SYSTEM SUMMARY:"
echo "- OS: $(lsb_release -d | cut -f2)"
echo "- Python: $(python3 --version)"
echo "- User: telegram-bot created"
echo "- Directory: /opt/telegram-bot configured"
echo "- Services: firewall, fail2ban enabled"
echo "- Virtual env: /opt/telegram-bot/venv ready"
echo ""
echo "NEXT STEPS:"
echo "1. Switch to telegram-bot user:"
echo "   su - telegram-bot"
echo ""
echo "2. Navigate to bot directory:"
echo "   cd /opt/telegram-bot"
echo ""
echo "3. Copy your bot code to /opt/telegram-bot/"
echo ""
echo "4. Configure environment:"
echo "   cp .env.template .env"
echo "   nano .env  # Edit with your API credentials"
echo ""
echo "5. Test environment:"
echo "   source venv/bin/activate"
echo "   python scripts/test_environment.py"
echo ""
echo "6. Start bot:"
echo "   python bot.py"
echo ""
echo "7. Enable as system service (optional):"
echo "   sudo systemctl enable telegram-bot"
echo "   sudo systemctl start telegram-bot"
echo ""
echo "USEFUL COMMANDS:"
echo "- Check security: /opt/telegram-bot/scripts/security_status.sh"
echo "- Check bot status: /opt/telegram-bot/status_bot.sh"
echo "- View logs: journalctl -u telegram-bot -f"
echo "- System monitor: /opt/telegram-bot/scripts/monitor.sh"
echo ""
print_status "Setup completed at $(date)"