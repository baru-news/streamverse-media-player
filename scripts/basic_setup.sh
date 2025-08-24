#!/bin/bash

# Phase 1: Basic VPS Setup Script
# Run this script as root: bash basic_setup.sh

set -e  # Exit on any error

echo "=== PHASE 1: BASIC VPS SETUP ==="
echo "Starting basic system setup..."

# Update system packages
echo "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    tmux \
    screen \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    tree \
    ncdu \
    iotop \
    iftop \
    nethogs

# Create non-root user for bot
echo "Creating telegram-bot user..."
useradd -m -s /bin/bash telegram-bot
usermod -aG sudo telegram-bot

# Create bot directory structure
echo "Creating directory structure..."
mkdir -p /opt/telegram-bot/{logs,config,scripts,backups}
chown -R telegram-bot:telegram-bot /opt/telegram-bot

# Setup timezone (adjust as needed)
echo "Setting timezone to Asia/Jakarta..."
timedatectl set-timezone Asia/Jakarta

# Install and configure automatic updates
echo "Configuring automatic security updates..."
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# Configure system limits for large file handling
echo "Configuring system limits for large files..."
cat >> /etc/security/limits.conf << EOF
# Telegram bot large file handling
telegram-bot soft nofile 65536
telegram-bot hard nofile 65536
telegram-bot soft nproc 32768
telegram-bot hard nproc 32768
EOF

# Configure sysctl for network optimization
echo "Optimizing network settings..."
cat >> /etc/sysctl.conf << EOF
# Network optimizations for large file transfers
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864
net.core.netdev_max_backlog = 5000
EOF

# Apply sysctl changes
sysctl -p

# Install monitoring tools
echo "Installing monitoring tools..."
apt install -y \
    htop \
    iotop \
    netstat-nat \
    ss \
    netcat

# Setup log rotation for bot logs
echo "Configuring log rotation..."
cat > /etc/logrotate.d/telegram-bot << EOF
/opt/telegram-bot/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su telegram-bot telegram-bot
}
EOF

# Create basic monitoring script
cat > /opt/telegram-bot/scripts/monitor.sh << 'EOF'
#!/bin/bash
# Basic system monitoring script

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4}'

echo -e "\nMemory Usage:"
free -h

echo -e "\nDisk Usage:"
df -h

echo -e "\nNetwork Connections:"
ss -tuln | grep :80

echo -e "\nRunning Processes:"
ps aux | grep -E "(python|telegram)" | grep -v grep
EOF

chmod +x /opt/telegram-bot/scripts/monitor.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/monitor.sh

# Setup basic backup structure
mkdir -p /opt/telegram-bot/backups/{daily,weekly,config}
chown -R telegram-bot:telegram-bot /opt/telegram-bot/backups

echo "=== BASIC SETUP COMPLETED ==="
echo "Next: Run security_setup.sh"
echo "System info:"
echo "- OS: $(lsb_release -d | cut -f2)"
echo "- Kernel: $(uname -r)"
echo "- Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "- Disk: $(df -h / | tail -1 | awk '{print $2}')"