#!/bin/bash

# Pre-setup Check Script
# Run this script before running the main setup scripts

set -e

echo "=== VPS SETUP PRE-CHECK ==="
echo "Checking system requirements and dependencies..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root"
    echo "   Run: sudo bash setup_precheck.sh"
    exit 1
fi

echo "✅ Running as root"

# Check OS version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "✅ OS: $NAME $VERSION"
    
    if [[ "$ID" != "ubuntu" ]]; then
        echo "⚠️  Warning: Scripts are designed for Ubuntu. Your OS: $ID"
    fi
    
    if [[ "$VERSION_ID" < "20.04" ]]; then
        echo "⚠️  Warning: Recommended Ubuntu 20.04 or newer. Your version: $VERSION_ID"
    fi
else
    echo "⚠️  Warning: Could not detect OS version"
fi

# Check system resources
echo ""
echo "=== SYSTEM RESOURCES ==="

# Check RAM
TOTAL_RAM=$(free -m | awk '/^Mem:/ {print $2}')
echo "RAM: ${TOTAL_RAM}MB"
if [ $TOTAL_RAM -lt 2048 ]; then
    echo "⚠️  Warning: Less than 2GB RAM. Recommended: 4GB+ for 2GB file handling"
else
    echo "✅ RAM is sufficient"
fi

# Check disk space
DISK_SPACE=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
echo "Available disk space: ${DISK_SPACE}GB"
if [ $DISK_SPACE -lt 20 ]; then
    echo "⚠️  Warning: Less than 20GB free space. Recommended: 50GB+"
else
    echo "✅ Disk space is sufficient"
fi

# Check CPU cores
CPU_CORES=$(nproc)
echo "CPU cores: $CPU_CORES"
if [ $CPU_CORES -lt 2 ]; then
    echo "⚠️  Warning: Less than 2 CPU cores. Recommended: 2+ cores"
else
    echo "✅ CPU cores are sufficient"
fi

# Check internet connectivity
echo ""
echo "=== CONNECTIVITY CHECK ==="
if ping -c 1 google.com > /dev/null 2>&1; then
    echo "✅ Internet connectivity OK"
else
    echo "❌ Error: No internet connectivity"
    exit 1
fi

# Check if packages can be updated
echo ""
echo "=== PACKAGE MANAGER CHECK ==="
if apt update > /dev/null 2>&1; then
    echo "✅ Package manager working"
else
    echo "❌ Error: Package manager not working"
    exit 1
fi

# Check for existing users
echo ""
echo "=== USER CHECK ==="
if id telegram-bot > /dev/null 2>&1; then
    echo "ℹ️  telegram-bot user already exists"
else
    echo "✅ telegram-bot user will be created"
fi

# Check for existing directories
if [ -d "/opt/telegram-bot" ]; then
    echo "ℹ️  /opt/telegram-bot directory already exists"
    echo "   Contents: $(ls -la /opt/telegram-bot 2>/dev/null | wc -l) items"
else
    echo "✅ /opt/telegram-bot directory will be created"
fi

# Check available packages
echo ""
echo "=== PACKAGE AVAILABILITY CHECK ==="
PACKAGES_TO_CHECK="python3 python3-pip git curl wget build-essential ufw fail2ban"
for pkg in $PACKAGES_TO_CHECK; do
    if apt-cache show $pkg > /dev/null 2>&1; then
        echo "✅ $pkg available"
    else
        echo "❌ $pkg not available"
    fi
done

# Check if ports are in use
echo ""
echo "=== PORT CHECK ==="
PORTS_TO_CHECK="22 80 443"
for port in $PORTS_TO_CHECK; do
    if netstat -tuln 2>/dev/null | grep ":$port " > /dev/null; then
        echo "ℹ️  Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

echo ""
echo "=== PRE-CHECK COMPLETED ==="
echo ""
echo "System appears ready for setup!"
echo ""
echo "Next steps:"
echo "1. Run: bash basic_setup.sh"
echo "2. Run: bash security_setup.sh"
echo "3. Run: bash python_setup.sh"
echo "4. Run: bash bot_environment.sh"
echo ""
echo "Or run all at once: bash complete_setup.sh"