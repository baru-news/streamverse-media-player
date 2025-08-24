# Phase 1: VPS Setup Guide for Telegram Bot Migration

## Overview
This guide will help you set up a VPS to run your self-hosted Telegram bot using Pyrogram for 2GB file handling.

## Step 1: VPS Purchase Recommendations

### Budget Options:
1. **Contabo VPS S (Recommended)**
   - 4 vCPU, 8GB RAM, 200GB SSD
   - Price: ~$7/month
   - Bandwidth: Unlimited
   - Good for 2GB file handling

2. **DigitalOcean Basic Droplet**
   - 2 vCPU, 4GB RAM, 80GB SSD
   - Price: ~$24/month
   - Better performance, premium support

### VPS Specifications Needed:
- **CPU**: Minimum 2 vCPU (4 vCPU recommended)
- **RAM**: Minimum 4GB (8GB recommended for 2GB files)
- **Storage**: Minimum 50GB SSD
- **Bandwidth**: Unlimited or high limit
- **OS**: Ubuntu 22.04 LTS

## Step 2: Initial Server Access

### After VPS Purchase:
1. You'll receive email with:
   - Server IP address
   - Root password
   - SSH access details

### First Login:
```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Update system packages
apt update && apt upgrade -y
```

## Step 3: Run Setup Scripts

Upload and run the provided setup scripts in this order:

1. **basic_setup.sh** - System updates and basic tools
2. **security_setup.sh** - Security hardening
3. **python_setup.sh** - Python environment
4. **bot_environment.sh** - Bot-specific setup

## Step 4: Verification

After running all scripts, verify installation:

```bash
# Check Python version
python3 --version  # Should be 3.11+

# Check virtual environment
source /opt/telegram-bot/venv/bin/activate
pip list

# Check services
systemctl status fail2ban
systemctl status ufw
```

## Next Steps

After completing Phase 1:
- Server will be ready for bot installation
- Security configured with firewall and fail2ban
- Python environment prepared
- Monitoring tools installed

Proceed to Phase 2: Telegram User Bot Development.

## Troubleshooting

### Common Issues:
1. **SSH Connection Refused**: Check if server is fully provisioned
2. **Permission Denied**: Ensure you're using root user initially
3. **Package Installation Fails**: Run `apt update` first

### Support Commands:
```bash
# Check server resources
htop
df -h
free -m

# View logs
journalctl -f
tail -f /var/log/syslog
```

## Security Notes
- Change root password immediately
- Setup SSH key authentication
- Never expose unnecessary ports
- Regular security updates are automated by scripts