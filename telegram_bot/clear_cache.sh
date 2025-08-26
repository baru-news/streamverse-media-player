#!/bin/bash
# Clear Python cache and compiled files

# Make script executable
chmod +x "$0" 2>/dev/null || true

echo "🧹 Clearing Python cache files..."

# Remove __pycache__ directories
find /opt/telegram-bot/telegram_bot -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove .pyc files
find /opt/telegram-bot/telegram_bot -name "*.pyc" -delete 2>/dev/null || true

# Remove .pyo files
find /opt/telegram-bot/telegram_bot -name "*.pyo" -delete 2>/dev/null || true

# Clear session files (they might be corrupted)
echo "🗑️  Clearing session files..."
rm -rf /opt/telegram-bot/sessions/* 2>/dev/null || true

# Clear any temp files
echo "🗑️  Clearing temp files..."
rm -rf /opt/telegram-bot/downloads/* 2>/dev/null || true

# Clear pip cache
echo "🧹 Clearing pip cache..."
pip cache purge 2>/dev/null || true

echo "✅ Cache cleared successfully!"
echo ""
echo "Next steps:"
echo "1. Run: cd /opt/telegram-bot"
echo "2. Run: source venv/bin/activate"
echo "3. Run: cd telegram_bot"
echo "4. Run: python test_pyrogram.py"