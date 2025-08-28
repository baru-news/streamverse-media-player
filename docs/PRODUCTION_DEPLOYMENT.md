# Production Deployment Guide

## Phase 5: Production-Ready Telegram Userbot

### Overview
This guide covers the complete production deployment of the Telegram userbot with enterprise-grade security, monitoring, and backup systems.

### Prerequisites
- VPS with minimum 4GB RAM, 2 CPU cores, 50GB storage
- Ubuntu 20.04+ or CentOS 8+
- Docker and Docker Compose installed
- Valid SSL certificates
- AWS account (optional, for cloud backups)

### Deployment Steps

#### 1. Security Setup
```bash
# Run security hardening
sudo ./scripts/security_setup.sh

# Configure firewall
sudo ufw enable
sudo ufw allow 22,80,443/tcp
```

#### 2. Environment Configuration
```bash
# Set production environment variables
export TELEGRAM_BOT_TOKEN="your_bot_token"
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key"
export DOODSTREAM_API_KEY="your_doodstream_key"

# Optional: Cloud backup
export AWS_ACCESS_KEY_ID="your_aws_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret"
export AWS_S3_BUCKET="telegram-bot-backups"
```

#### 3. Production Deployment
```bash
# Deploy using production script
./scripts/deploy_production.sh

# Or using Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

#### 4. Verification
```bash
# Run comprehensive health check
./scripts/health_check.sh

# Verify all services
docker-compose -f docker-compose.production.yml ps
```

### Monitoring & Maintenance

#### Health Monitoring
- Automated system health checks every 60 seconds
- Real-time alerts via Telegram and email
- Performance metrics stored in Supabase
- Weekly health reports generated automatically

#### Security Features
- Rate limiting and IP blocking
- Suspicious activity detection
- Encrypted configuration storage
- API key rotation scheduling
- Comprehensive audit logging

#### Backup System
- Daily incremental backups at 2 AM
- Weekly full backups on Sundays
- Monthly archives with 30-day retention
- Cloud storage integration (AWS S3)
- One-click disaster recovery

### Production Checklist

- [ ] Security hardening completed
- [ ] SSL certificates configured
- [ ] Monitoring dashboards accessible
- [ ] Backup system tested
- [ ] Alert notifications working
- [ ] Performance baselines established
- [ ] Documentation reviewed
- [ ] Team training completed

### Support & Troubleshooting

For issues, check:
1. System logs: `/var/log/telegram-bot/`
2. Health status: `./scripts/health_check.sh`
3. Service status: `systemctl --user status telegram-userbot`
4. Resource usage: `htop` and `df -h`

### Emergency Procedures

**System Failure:**
```bash
# Emergency backup
./scripts/backup_manager.sh emergency

# Rollback deployment
./scripts/deploy_production.sh rollback
```

**Performance Issues:**
```bash
# Quick diagnostics
./scripts/health_check.sh system

# Resource cleanup
docker system prune -f
```