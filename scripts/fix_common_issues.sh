#!/bin/bash

# Fix Common Setup Issues Script
# Run this if you encounter errors during setup

set -e

echo "=== FIXING COMMON SETUP ISSUES ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root"
    exit 1
fi

echo "Applying common fixes..."

# Fix 1: Package dependency issues
echo "1. Fixing package dependencies..."
apt update
apt install -y python3-launchpadlib software-properties-common

# Fix 2: Missing packages that caused errors
echo "2. Installing missing monitoring tools..."
apt install -y net-tools iproute2 netcat-traditional || echo "Some packages may already be installed"

# Fix 3: Fix telegram-bot user if creation failed
echo "3. Checking telegram-bot user..."
if ! id telegram-bot > /dev/null 2>&1; then
    echo "Creating telegram-bot user..."
    useradd -m -s /bin/bash telegram-bot
    usermod -aG sudo telegram-bot
else
    echo "telegram-bot user already exists"
fi

# Fix 4: Fix directory permissions
echo "4. Fixing directory permissions..."
if [ -d "/opt/telegram-bot" ]; then
    mkdir -p /opt/telegram-bot/{config,logs,scripts,backups,tmp,sessions,uploads,downloads,data,templates,static}
    chown -R telegram-bot:telegram-bot /opt/telegram-bot
    chmod -R 755 /opt/telegram-bot
    echo "Directory permissions fixed"
fi

# Fix 5: Fix rkhunter configuration
echo "5. Fixing rkhunter configuration..."
if [ -f /etc/rkhunter.conf ]; then
    if grep -q "WEB_CMD.*false" /etc/rkhunter.conf; then
        echo "WEB_CMD=/bin/false" >> /etc/rkhunter.conf
    else
        sed -i 's|^WEB_CMD=.*|WEB_CMD=/bin/false|' /etc/rkhunter.conf
    fi
    echo "rkhunter configuration fixed"
fi

# Fix 6: Clean up failed installations
echo "6. Cleaning up package cache..."
apt autoremove -y
apt autoclean

# Fix 7: Reset UFW if it's in bad state
echo "7. Resetting firewall if needed..."
if command -v ufw > /dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw --force enable
    echo "Firewall reset and reconfigured"
fi

# Fix 8: Check and fix Python installation
echo "8. Checking Python installation..."
if command -v python3.11 > /dev/null; then
    echo "Python 3.11 is available"
    # Make sure pip is working
    python3.11 -m pip --version || {
        echo "Installing pip for Python 3.11..."
        curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
    }
else
    echo "Python 3.11 not found, trying to install..."
    apt install -y python3.11 python3.11-dev python3.11-venv python3.11-distutils || {
        echo "Could not install Python 3.11, falling back to system Python"
        apt install -y python3 python3-dev python3-venv python3-pip
    }
fi

# Fix 9: Recreate virtual environment if corrupted
echo "9. Checking virtual environment..."
if [ -d "/opt/telegram-bot/venv" ]; then
    # Test if venv is working
    if ! su - telegram-bot -c "source /opt/telegram-bot/venv/bin/activate && python --version" > /dev/null 2>&1; then
        echo "Virtual environment corrupted, recreating..."
        rm -rf /opt/telegram-bot/venv
        su - telegram-bot -c "python3 -m venv /opt/telegram-bot/venv"
        su - telegram-bot -c "source /opt/telegram-bot/venv/bin/activate && pip install --upgrade pip setuptools wheel"
    fi
else
    echo "Creating virtual environment..."
    su - telegram-bot -c "python3 -m venv /opt/telegram-bot/venv"
    su - telegram-bot -c "source /opt/telegram-bot/venv/bin/activate && pip install --upgrade pip setuptools wheel"
fi

# Fix 10: Fix systemd service permissions
echo "10. Fixing systemd service..."
if [ -f "/etc/systemd/system/telegram-bot.service" ]; then
    systemctl daemon-reload
    echo "Systemd service reloaded"
fi

echo ""
echo "=== COMMON ISSUES FIXED ==="
echo "You can now try running the setup scripts again:"
echo "1. bash scripts/basic_setup.sh"
echo "2. bash scripts/security_setup.sh"
echo "3. bash scripts/python_setup.sh"
echo "4. bash scripts/bot_environment.sh"
echo ""
echo "Or run: bash scripts/complete_setup.sh"