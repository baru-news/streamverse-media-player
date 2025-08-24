# Phase 1 Execution Checklist

## 🎯 Goal
Setup VPS with secure environment for self-hosted Telegram bot capable of handling 2GB file uploads.

## 📋 Step-by-Step Execution

### 1. Purchase VPS
**Recommended: Contabo VPS S**
- CPU: 4 vCPU
- RAM: 8GB
- Storage: 200GB SSD
- Price: ~$7/month
- Sign up at: https://contabo.com

**Alternative: DigitalOcean**
- CPU: 2 vCPU  
- RAM: 4GB
- Storage: 80GB SSD
- Price: ~$24/month
- Sign up at: https://digitalocean.com

### 2. Initial Server Access
```bash
# Connect to your server (replace YOUR_SERVER_IP)
ssh root@YOUR_SERVER_IP

# Enter password provided in email
# Update system
apt update && apt upgrade -y
```

### 3. Upload Setup Scripts
```bash
# Create scripts directory
mkdir -p /root/setup

# Upload all scripts from the scripts/ folder to /root/setup/
# You can use scp, sftp, or copy-paste each script
```

### 4. Run Setup Scripts in Order
```bash
# Make scripts executable
chmod +x /root/setup/*.sh

# Run in this exact order:
cd /root/setup

# 1. Basic system setup (5-10 minutes)
bash basic_setup.sh

# 2. Security configuration (3-5 minutes)  
bash security_setup.sh

# 3. Python environment (10-15 minutes)
bash python_setup.sh

# 4. Bot environment setup (2-3 minutes)
bash bot_environment.sh
```

### 5. Verification
```bash
# Check if everything is installed correctly
su - telegram-bot -c "/opt/telegram-bot/scripts/check_environment.sh"

# Check security status
/opt/telegram-bot/scripts/security_status.sh

# Check system resources
htop
```

## ✅ Success Criteria

After Phase 1, you should have:
- ✅ Ubuntu 22.04 VPS running
- ✅ Python 3.11 with virtual environment
- ✅ All required packages installed
- ✅ Security hardening (firewall, fail2ban, SSH)
- ✅ Monitoring scripts configured
- ✅ Directory structure created
- ✅ Systemd service template ready
- ✅ Backup system configured

## 🔧 Troubleshooting

### Common Issues:
1. **Script Permission Denied**: Run `chmod +x script_name.sh`
2. **Package Installation Fails**: Run `apt update` first
3. **Python Import Error**: Check virtual environment activation
4. **SSH Connection Issues**: Verify server IP and credentials

### Get Help:
```bash
# Check system logs
tail -f /var/log/syslog

# Check script output
bash -x script_name.sh

# Test environment
su - telegram-bot -c "source /opt/telegram-bot/venv/bin/activate && python -c 'import pyrogram; print(\"OK\")'"
```

## 📁 What You Get

After Phase 1 completion:

```
/opt/telegram-bot/
├── venv/                 # Python virtual environment
├── config/               # Configuration files
├── logs/                 # Log files
├── scripts/              # Management scripts
├── backups/             # Automatic backups
├── tmp/                 # Temporary files
├── sessions/            # Telegram session files
└── requirements.txt     # Python dependencies
```

**Management Scripts:**
- `start_bot.sh` - Start bot manually
- `stop_bot.sh` - Stop bot
- `status_bot.sh` - Check bot status
- `scripts/backup.sh` - Manual backup
- `scripts/security_status.sh` - Security overview

## 🚀 Next Phase
Once Phase 1 is complete, proceed to **Phase 2: Telegram User Bot Development** where we'll create the actual bot code for 2GB file handling and dual Doodstream uploads.

---

**Estimated Time: 30-45 minutes**  
**Difficulty: Beginner-friendly with copy-paste commands**