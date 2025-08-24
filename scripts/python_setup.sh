#!/bin/bash

# Phase 1: Python Environment Setup Script
# Run this script as root: bash python_setup.sh

set -e  # Exit on any error

echo "=== PHASE 1: PYTHON ENVIRONMENT SETUP ==="
echo "Starting Python environment configuration..."

# Install Python 3.11 and dependencies
echo "Installing Python 3.11..."
apt update
apt install -y software-properties-common
add-apt-repository ppa:deadsnakes/ppa -y
apt update

apt install -y \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    python3.11-distutils

# Make Python 3.11 the default python3
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install pip for Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Verify Python installation
echo "Python version: $(python3 --version)"
echo "Pip version: $(pip3 --version)"

# Create virtual environment for telegram bot
echo "Creating virtual environment..."
su - telegram-bot -c "python3 -m venv /opt/telegram-bot/venv"

# Activate virtual environment and install basic packages
echo "Installing basic Python packages..."
su - telegram-bot -c "
source /opt/telegram-bot/venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install --upgrade \
    pyrogram \
    tgcrypto \
    requests \
    aiohttp \
    aiofiles \
    python-dotenv \
    psutil \
    schedule \
    python-telegram-bot \
    supabase \
    asyncpg \
    uvloop \
    fastapi \
    uvicorn \
    jinja2 \
    python-multipart \
    watchfiles
"

# Create requirements.txt for future reference
cat > /opt/telegram-bot/requirements.txt << EOF
# Telegram Bot Core
pyrogram==2.0.106
tgcrypto==1.2.5

# HTTP and Async
aiohttp==3.9.1
aiofiles==23.2.0
requests==2.31.0
uvloop==0.19.0

# Database
supabase==2.3.4
asyncpg==0.29.0

# Environment and Configuration
python-dotenv==1.0.0

# System and Monitoring
psutil==5.9.6
schedule==1.2.0

# Web Interface (Optional)
fastapi==0.108.0
uvicorn[standard]==0.25.0
jinja2==3.1.2
python-multipart==0.0.6
watchfiles==0.21.0

# Utilities
python-telegram-bot==20.7
EOF

chown telegram-bot:telegram-bot /opt/telegram-bot/requirements.txt

# Install system dependencies for media processing
echo "Installing media processing dependencies..."
apt install -y \
    ffmpeg \
    imagemagick \
    libmagic1 \
    libmagic-dev \
    file

# Create Python environment activation script
cat > /opt/telegram-bot/activate.sh << 'EOF'
#!/bin/bash
# Telegram Bot Environment Activation Script

echo "Activating Telegram Bot Python Environment..."
source /opt/telegram-bot/venv/bin/activate

echo "Environment activated!"
echo "Python: $(which python)"
echo "Pip: $(which pip)"
echo ""
echo "Available commands:"
echo "  - python bot.py    (start the bot)"
echo "  - pip install pkg  (install packages)"
echo "  - deactivate       (exit environment)"
EOF

chmod +x /opt/telegram-bot/activate.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/activate.sh

# Create Python path configuration
echo "Configuring Python paths..."
echo 'export PYTHONPATH="/opt/telegram-bot:$PYTHONPATH"' >> /home/telegram-bot/.bashrc
echo 'export PATH="/opt/telegram-bot/venv/bin:$PATH"' >> /home/telegram-bot/.bashrc

# Create environment configuration template
cat > /opt/telegram-bot/.env.template << 'EOF'
# Telegram API Configuration
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_NAME=telegram_bot
TELEGRAM_PHONE_NUMBER=your_phone_number

# Doodstream API Configuration
DOODSTREAM_API_KEY_REGULAR=your_regular_api_key
DOODSTREAM_API_KEY_PREMIUM=your_premium_api_key

# Supabase Configuration
SUPABASE_URL=https://agsqdznjjxptiyorljtv.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Bot Configuration
MAX_FILE_SIZE=2147483648  # 2GB in bytes
CHUNK_SIZE=1048576        # 1MB chunks
MAX_CONCURRENT_UPLOADS=3
RETRY_ATTEMPTS=3

# Admin Configuration
ADMIN_USER_IDS=123456789,987654321  # Comma-separated list

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/opt/telegram-bot/logs/bot.log
LOG_MAX_SIZE=10485760     # 10MB
LOG_BACKUP_COUNT=5

# Monitoring Configuration
ENABLE_WEB_DASHBOARD=false
WEB_DASHBOARD_PORT=8080
WEB_DASHBOARD_HOST=0.0.0.0
EOF

chown telegram-bot:telegram-bot /opt/telegram-bot/.env.template

# Create virtual environment test script
cat > /opt/telegram-bot/scripts/test_environment.py << 'EOF'
#!/usr/bin/env python3
"""
Test script to verify Python environment setup
"""

import sys
import os
import importlib
import platform

def test_python_version():
    """Test Python version"""
    version = sys.version_info
    print(f"Python Version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 11:
        print("✅ Python version is compatible")
        return True
    else:
        print("❌ Python version is not compatible (need 3.11+)")
        return False

def test_packages():
    """Test required packages"""
    required_packages = [
        'pyrogram',
        'tgcrypto',
        'aiohttp',
        'aiofiles',
        'requests',
        'psutil',
        'supabase',
        'asyncpg',
        'fastapi',
        'uvicorn'
    ]
    
    print("\nTesting package imports...")
    all_good = True
    
    for package in required_packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError as e:
            print(f"❌ {package}: {e}")
            all_good = False
    
    return all_good

def test_system_info():
    """Display system information"""
    print(f"\nSystem Information:")
    print(f"Platform: {platform.platform()}")
    print(f"Architecture: {platform.architecture()[0]}")
    print(f"Processor: {platform.processor()}")
    print(f"Python executable: {sys.executable}")
    print(f"Python path: {sys.path[0]}")

def test_file_permissions():
    """Test file permissions"""
    test_file = "/opt/telegram-bot/test_write.txt"
    try:
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print("✅ File write permissions OK")
        return True
    except Exception as e:
        print(f"❌ File write permissions: {e}")
        return False

def main():
    print("=== TELEGRAM BOT ENVIRONMENT TEST ===")
    
    tests = [
        ("Python Version", test_python_version),
        ("Package Imports", test_packages),
        ("File Permissions", test_file_permissions)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        results.append(test_func())
    
    test_system_info()
    
    print(f"\n=== TEST RESULTS ===")
    if all(results):
        print("🎉 All tests passed! Environment is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
EOF

chmod +x /opt/telegram-bot/scripts/test_environment.py
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/test_environment.py

# Test the environment
echo "Testing Python environment..."
su - telegram-bot -c "
cd /opt/telegram-bot
source venv/bin/activate
python scripts/test_environment.py
"

# Create systemd service template for the bot
cat > /etc/systemd/system/telegram-bot.service << 'EOF'
[Unit]
Description=Telegram Bot for Doodstream Integration
After=network.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=telegram-bot
Group=telegram-bot
WorkingDirectory=/opt/telegram-bot
Environment=PATH=/opt/telegram-bot/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/telegram-bot/venv/bin/python bot.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=5
StandardOutput=append:/opt/telegram-bot/logs/bot.log
StandardError=append:/opt/telegram-bot/logs/bot-error.log

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/telegram-bot

[Install]
WantedBy=multi-user.target
EOF

# Enable the service (but don't start it yet)
systemctl daemon-reload

echo "=== PYTHON ENVIRONMENT SETUP COMPLETED ==="
echo "Environment details:"
echo "- Python: $(python3 --version)"
echo "- Virtual environment: /opt/telegram-bot/venv"
echo "- Requirements installed: $(su - telegram-bot -c 'source /opt/telegram-bot/venv/bin/activate && pip list | wc -l') packages"
echo "- Service configured: telegram-bot.service"
echo ""
echo "To test environment:"
echo "  su - telegram-bot"
echo "  cd /opt/telegram-bot"
echo "  source venv/bin/activate"
echo "  python scripts/test_environment.py"
echo ""
echo "Next: Run bot_environment.sh"