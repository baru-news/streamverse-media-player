#!/bin/bash

# Phase 1: Security Setup Script
# Run this script as root: bash security_setup.sh

set -e  # Exit on any error

echo "=== PHASE 1: SECURITY SETUP ==="
echo "Starting security configuration..."

# Install and configure UFW (Uncomplicated Firewall)
echo "Configuring firewall..."
apt install -y ufw

# Reset UFW to defaults
ufw --force reset

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (adjust port if you changed it)
ufw allow 22/tcp

# Allow HTTP and HTTPS (if needed for monitoring dashboard later)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable UFW
ufw --force enable

# Install and configure fail2ban
echo "Installing fail2ban..."
apt install -y fail2ban

# Configure fail2ban for SSH protection
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

# Start and enable fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Secure SSH configuration
echo "Securing SSH configuration..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create secure SSH config
cat > /etc/ssh/sshd_config << EOF
# Secure SSH Configuration for Telegram Bot Server

# Basic settings
Port 22
Protocol 2
AddressFamily inet

# Authentication
PermitRootLogin yes
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security settings
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2

# Subsystem
Subsystem sftp /usr/lib/openssh/sftp-server

# Allow specific users
AllowUsers root telegram-bot
EOF

# Restart SSH service
systemctl restart sshd

# Install and configure automatic security updates
echo "Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

# Setup system monitoring and alerts
echo "Setting up system monitoring..."

# Create security monitoring script
cat > /opt/telegram-bot/scripts/security_check.sh << 'EOF'
#!/bin/bash
# Security monitoring script

LOG_FILE="/opt/telegram-bot/logs/security.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting security check..." >> $LOG_FILE

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "[$DATE] WARNING: $FAILED_LOGINS failed login attempts detected" >> $LOG_FILE
fi

# Check fail2ban status
BANNED_IPS=$(fail2ban-client status sshd | grep "Banned IP list" | awk -F: '{print $2}' | wc -w)
if [ $BANNED_IPS -gt 0 ]; then
    echo "[$DATE] INFO: $BANNED_IPS IPs currently banned by fail2ban" >> $LOG_FILE
fi

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "[$DATE] Security check completed" >> $LOG_FILE
EOF

chmod +x /opt/telegram-bot/scripts/security_check.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/security_check.sh

# Setup cron job for security monitoring
echo "Setting up security monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/30 * * * * /opt/telegram-bot/scripts/security_check.sh") | crontab -

# Create log directory
mkdir -p /opt/telegram-bot/logs
chown -R telegram-bot:telegram-bot /opt/telegram-bot/logs

# Install additional security tools
echo "Installing additional security tools..."
apt install -y \
    rkhunter \
    chkrootkit \
    lynis

# Configure rkhunter
rkhunter --update || echo "Warning: rkhunter update failed, continuing..."

# Fix rkhunter configuration
if [ -f /etc/rkhunter.conf ]; then
    # Update WEB_CMD setting
    sed -i 's|^WEB_CMD=.*|WEB_CMD=/bin/false|' /etc/rkhunter.conf || echo "WEB_CMD=/bin/false" >> /etc/rkhunter.conf
fi

rkhunter --propupd || echo "Warning: rkhunter propupd failed, continuing..."

# Setup file integrity monitoring
echo "Setting up file integrity monitoring..."
cat > /opt/telegram-bot/scripts/integrity_check.sh << 'EOF'
#!/bin/bash
# File integrity monitoring

LOG_FILE="/opt/telegram-bot/logs/integrity.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting file integrity check..." >> $LOG_FILE

# Check important system files
CRITICAL_FILES="/etc/passwd /etc/shadow /etc/group /etc/sudoers /etc/ssh/sshd_config"

for file in $CRITICAL_FILES; do
    if [ -f "$file" ]; then
        CHECKSUM=$(sha256sum "$file" | awk '{print $1}')
        echo "[$DATE] $file: $CHECKSUM" >> $LOG_FILE
    fi
done

echo "[$DATE] File integrity check completed" >> $LOG_FILE
EOF

chmod +x /opt/telegram-bot/scripts/integrity_check.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/integrity_check.sh

# Setup daily integrity check
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/telegram-bot/scripts/integrity_check.sh") | crontab -

# Create security status script
cat > /opt/telegram-bot/scripts/security_status.sh << 'EOF'
#!/bin/bash
# Security status overview

echo "=== SECURITY STATUS ==="
echo "Firewall Status:"
ufw status

echo -e "\nFail2ban Status:"
fail2ban-client status

echo -e "\nRecent Failed Logins:"
grep "Failed password" /var/log/auth.log | tail -5

echo -e "\nCurrent SSH Connections:"
ss -tn state established '( dport = :22 or sport = :22 )'

echo -e "\nSystem Load:"
uptime

echo -e "\nActive Services:"
systemctl list-units --type=service --state=active | grep -E "(ssh|fail2ban|ufw)"
EOF

chmod +x /opt/telegram-bot/scripts/security_status.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/security_status.sh

echo "=== SECURITY SETUP COMPLETED ==="
echo "Security features enabled:"
echo "- UFW firewall (ports 22, 80, 443 open)"
echo "- fail2ban for SSH protection"
echo "- Secure SSH configuration"
echo "- Automatic security updates"
echo "- Security monitoring scripts"
echo "- File integrity monitoring"
echo ""
echo "Next: Run python_setup.sh"
echo ""
echo "To check security status: /opt/telegram-bot/scripts/security_status.sh"