#!/bin/bash
# Clean reinstall of Pyrogram and dependencies

# Make script executable
chmod +x "$0" 2>/dev/null || true

echo "🔄 Clean reinstall of Pyrogram..."

# Activate virtual environment
source /opt/telegram-bot/venv/bin/activate

# Uninstall pyrogram and related packages
echo "📦 Uninstalling Pyrogram..."
pip uninstall -y pyrogram pyaes pysocks 2>/dev/null || true

# Clear pip cache
pip cache purge

# Reinstall from scratch
echo "📥 Installing Pyrogram from scratch..."
pip install pyrogram==2.0.106

# Verify installation
echo "✅ Verifying installation..."
python -c "import pyrogram; print(f'Pyrogram version: {pyrogram.__version__}')"

# Also reinstall other dependencies that might conflict
echo "📦 Reinstalling other dependencies..."
pip install --upgrade python-dotenv requests aiohttp

echo "🎉 Reinstallation complete!"
echo ""
echo "Next steps:"
echo "1. Run: cd /opt/telegram-bot/telegram_bot"
echo "2. Run: python test_pyrogram.py"