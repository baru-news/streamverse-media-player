#!/bin/bash
# Script to setup environment variables for Telegram Bot

echo "🔧 Setting up environment variables for Telegram Bot..."

# Check if template exists
if [ ! -f "/opt/telegram-bot/telegram_bot/.env.template" ]; then
    echo "❌ Template file not found at /opt/telegram-bot/telegram_bot/.env.template"
    exit 1
fi

# Copy template to correct location
echo "📋 Copying .env.template to /opt/telegram-bot/.env..."
cp /opt/telegram-bot/telegram_bot/.env.template /opt/telegram-bot/.env

# Set proper ownership and permissions
echo "🔐 Setting proper permissions..."
chown telegram-bot:telegram-bot /opt/telegram-bot/.env
chmod 600 /opt/telegram-bot/.env

echo "✅ Environment file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You must now edit /opt/telegram-bot/.env with your credentials:"
echo "   - TELEGRAM_API_ID (from my.telegram.org)"
echo "   - TELEGRAM_API_HASH (from my.telegram.org)"
echo "   - TELEGRAM_PHONE_NUMBER (format: +628xxxxx)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)"
echo "   - DOODSTREAM_API_KEY (from Doodstream account)"
echo "   - DOODSTREAM_PREMIUM_API_KEY (from Doodstream account)"
echo ""
echo "📝 Edit with: nano /opt/telegram-bot/.env"
echo "🧪 Test with: sudo -u telegram-bot /opt/telegram-bot/venv/bin/python /opt/telegram-bot/telegram_bot/main.py"
echo "🚀 Start service: sudo systemctl start telegram-bot"