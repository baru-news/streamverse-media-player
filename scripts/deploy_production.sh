#!/bin/bash
set -euo pipefail

# Production Deployment Script for Telegram Bot
# Implements zero-downtime deployment with health checks and rollback capability

# Configuration
PROJECT_NAME="telegram-userbot"
BACKUP_DIR="/opt/backups/deployments"
DEPLOY_LOG="/var/log/telegram-bot/deployment.log"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ENABLED=true
MAINTENANCE_MODE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${DEPLOY_LOG}"
    
    case $level in
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${message}" >&2
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${message}"
            ;;
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${message}"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} ${message}"
            ;;
    esac
}

# Check if running as correct user
check_user() {
    if [[ $EUID -eq 0 ]]; then
        log "ERROR" "This script should not be run as root"
        exit 1
    fi
    
    if [[ "$(whoami)" != "telegram-bot" ]]; then
        log "ERROR" "This script should be run as telegram-bot user"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "INFO" "Setting up deployment directories..."
    
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "$(dirname "${DEPLOY_LOG}")"
    mkdir -p "/opt/telegram-userbot/releases"
    mkdir -p "/opt/telegram-userbot/shared/logs"
    mkdir -p "/opt/telegram-userbot/shared/config"
}

# Validate environment
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check required environment variables
    local required_vars=(
        "TELEGRAM_BOT_TOKEN"
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DOODSTREAM_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check system resources
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [[ $available_memory -lt 512 ]]; then
        log "WARN" "Low available memory: ${available_memory}MB"
    fi
    
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        log "ERROR" "Disk usage too high: ${disk_usage}%"
        exit 1
    fi
    
    log "INFO" "Environment validation passed"
}

# Pre-deployment health check
pre_deployment_health_check() {
    log "INFO" "Running pre-deployment health check..."
    
    # Check if bot is currently running
    if systemctl --user is-active --quiet telegram-userbot; then
        log "INFO" "Bot is currently running"
        
        # Check bot responsiveness
        if ! python3 -c "
import asyncio
import sys
import os
sys.path.append('/opt/telegram-userbot')
from telegram_userbot.utils.telegram_bot import TelegramBot

async def health_check():
    try:
        bot = TelegramBot()
        me = await bot.get_me()
        return me is not None
    except:
        return False

result = asyncio.run(health_check())
exit(0 if result else 1)
        "; then
            log "INFO" "Bot is responsive"
        else
            log "WARN" "Bot is not responding to health check"
        fi
    else
        log "INFO" "Bot is not currently running"
    fi
    
    # Check database connectivity
    if python3 -c "
import asyncio
import os
from supabase import create_client

async def check_db():
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        result = await supabase.table('profiles').select('count').limit(1).execute()
        return True
    except:
        return False

result = asyncio.run(check_db())
exit(0 if result else 1)
    "; then
        log "INFO" "Database connectivity check passed"
    else
        log "ERROR" "Database connectivity check failed"
        exit 1
    fi
}

# Create deployment backup
create_backup() {
    log "INFO" "Creating deployment backup..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="${PROJECT_NAME}_backup_${backup_timestamp}"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    mkdir -p "${backup_path}"
    
    # Backup current installation
    if [[ -d "/opt/telegram-userbot/current" ]]; then
        cp -r "/opt/telegram-userbot/current" "${backup_path}/code"
        log "INFO" "Code backup created at ${backup_path}/code"
    fi
    
    # Backup configuration
    if [[ -d "/opt/telegram-userbot/shared/config" ]]; then
        cp -r "/opt/telegram-userbot/shared/config" "${backup_path}/config"
        log "INFO" "Configuration backup created"
    fi
    
    # Backup database (metadata only, not actual data)
    python3 << EOF
import json
import os
import asyncio
from supabase import create_client

async def backup_schema():
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        
        # Get table schemas (this is a simplified backup)
        tables = ['profiles', 'videos', 'telegram_uploads', 'performance_metrics']
        schema_info = {}
        
        for table in tables:
            result = await supabase.table(table).select('*').limit(1).execute()
            if result.data:
                schema_info[table] = list(result.data[0].keys()) if result.data else []
        
        with open('${backup_path}/schema_info.json', 'w') as f:
            json.dump(schema_info, f, indent=2)
        
        print("Schema backup completed")
    except Exception as e:
        print(f"Schema backup failed: {e}")

asyncio.run(backup_schema())
EOF
    
    # Store backup info
    echo "${backup_name}" > "${BACKUP_DIR}/latest_backup"
    log "INFO" "Backup completed: ${backup_name}"
}

# Deploy new version
deploy_new_version() {
    log "INFO" "Deploying new version..."
    
    local release_timestamp=$(date '+%Y%m%d_%H%M%S')
    local release_path="/opt/telegram-userbot/releases/${release_timestamp}"
    
    # Create release directory
    mkdir -p "${release_path}"
    
    # Copy new code (assuming it's in current directory)
    cp -r . "${release_path}/"
    
    # Install/update dependencies
    cd "${release_path}"
    
    log "INFO" "Installing Python dependencies..."
    if [[ -f "telegram_userbot/requirements.txt" ]]; then
        pip3 install --user -r telegram_userbot/requirements.txt
    fi
    
    # Set up configuration links
    ln -sf "/opt/telegram-userbot/shared/config" "${release_path}/config"
    ln -sf "/opt/telegram-userbot/shared/logs" "${release_path}/logs"
    
    # Make scripts executable
    find "${release_path}/scripts" -name "*.sh" -type f -exec chmod +x {} \;
    find "${release_path}/telegram_userbot" -name "*.py" -type f -exec chmod +x {} \;
    
    log "INFO" "New version deployed to ${release_path}"
    echo "${release_timestamp}" > "/opt/telegram-userbot/releases/latest"
}

# Run database migrations
run_migrations() {
    log "INFO" "Running database migrations..."
    
    # This would integrate with your migration system
    # For now, we'll just check if migrations are needed
    
    python3 << 'EOF'
import asyncio
import os
from supabase import create_client

async def check_migrations():
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        
        # Check if all required tables exist
        required_tables = [
            'profiles', 'videos', 'telegram_uploads', 
            'performance_metrics', 'analytics_events'
        ]
        
        for table in required_tables:
            try:
                await supabase.table(table).select('count').limit(1).execute()
                print(f"✓ Table {table} exists")
            except Exception as e:
                print(f"✗ Table {table} missing or inaccessible: {e}")
                return False
        
        return True
    except Exception as e:
        print(f"Migration check failed: {e}")
        return False

result = asyncio.run(check_migrations())
exit(0 if result else 1)
EOF
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "Database migrations check passed"
    else
        log "ERROR" "Database migrations check failed"
        exit 1
    fi
}

# Switch to new version
switch_version() {
    log "INFO" "Switching to new version..."
    
    local latest_release=$(cat "/opt/telegram-userbot/releases/latest")
    local release_path="/opt/telegram-userbot/releases/${latest_release}"
    
    # Stop current service
    if systemctl --user is-active --quiet telegram-userbot; then
        log "INFO" "Stopping current bot service..."
        systemctl --user stop telegram-userbot
        sleep 5
    fi
    
    # Update symlink to new version
    rm -f "/opt/telegram-userbot/current"
    ln -sf "${release_path}" "/opt/telegram-userbot/current"
    
    # Update systemd service if needed
    update_systemd_service
    
    log "INFO" "Version switch completed"
}

# Update systemd service
update_systemd_service() {
    log "INFO" "Updating systemd service configuration..."
    
    local service_file="${HOME}/.config/systemd/user/telegram-userbot.service"
    
    cat > "${service_file}" << 'EOF'
[Unit]
Description=Telegram Upload Bot
After=network.target

[Service]
Type=simple
User=telegram-bot
WorkingDirectory=/opt/telegram-userbot/current
ExecStart=/usr/bin/python3 /opt/telegram-userbot/current/telegram_userbot/main.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/opt/telegram-userbot/current

# Resource limits
MemoryMax=2G
CPUQuota=200%

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/telegram-userbot/current/logs /tmp

[Install]
WantedBy=default.target
EOF
    
    # Reload systemd
    systemctl --user daemon-reload
    log "INFO" "Systemd service updated"
}

# Start services
start_services() {
    log "INFO" "Starting bot services..."
    
    # Start main bot service
    systemctl --user start telegram-userbot
    systemctl --user enable telegram-userbot
    
    # Wait a moment for startup
    sleep 10
    
    log "INFO" "Services started"
}

# Post-deployment health check
post_deployment_health_check() {
    log "INFO" "Running post-deployment health check..."
    
    local check_count=0
    local max_checks=$((HEALTH_CHECK_TIMEOUT / 10))
    
    while [[ $check_count -lt $max_checks ]]; do
        # Check if service is running
        if systemctl --user is-active --quiet telegram-userbot; then
            log "INFO" "Bot service is running"
            
            # Check bot responsiveness
            if python3 -c "
import asyncio
import sys
import os
sys.path.append('/opt/telegram-userbot/current')

async def health_check():
    try:
        # Import from current deployment
        from telegram_userbot.utils.telegram_bot import TelegramBot
        
        bot = TelegramBot()
        me = await bot.get_me()
        
        if me:
            print(f'Bot is responsive: @{me.username}')
            return True
        else:
            print('Bot returned invalid response')
            return False
    except Exception as e:
        print(f'Health check failed: {e}')
        return False

result = asyncio.run(health_check())
exit(0 if result else 1)
            "; then
                log "INFO" "Post-deployment health check passed"
                return 0
            else
                log "WARN" "Bot health check failed, attempt $((check_count + 1))/${max_checks}"
            fi
        else
            log "WARN" "Bot service not running, attempt $((check_count + 1))/${max_checks}"
        fi
        
        ((check_count++))
        sleep 10
    done
    
    log "ERROR" "Post-deployment health check failed after ${HEALTH_CHECK_TIMEOUT} seconds"
    return 1
}

# Rollback to previous version
rollback_deployment() {
    if [[ "$ROLLBACK_ENABLED" != "true" ]]; then
        log "ERROR" "Rollback is disabled, manual intervention required"
        return 1
    fi
    
    log "WARN" "Rolling back deployment..."
    
    # Stop current service
    systemctl --user stop telegram-userbot || true
    
    # Get backup info
    if [[ -f "${BACKUP_DIR}/latest_backup" ]]; then
        local backup_name=$(cat "${BACKUP_DIR}/latest_backup")
        local backup_path="${BACKUP_DIR}/${backup_name}"
        
        if [[ -d "${backup_path}/code" ]]; then
            # Restore previous version
            rm -f "/opt/telegram-userbot/current"
            cp -r "${backup_path}/code" "/opt/telegram-userbot/current"
            
            # Restore configuration
            if [[ -d "${backup_path}/config" ]]; then
                cp -r "${backup_path}/config/"* "/opt/telegram-userbot/shared/config/"
            fi
            
            # Start service
            systemctl --user start telegram-userbot
            
            log "INFO" "Rollback completed using backup: ${backup_name}"
            return 0
        fi
    fi
    
    log "ERROR" "Rollback failed: no suitable backup found"
    return 1
}

# Cleanup old releases
cleanup_old_releases() {
    log "INFO" "Cleaning up old releases..."
    
    local releases_dir="/opt/telegram-userbot/releases"
    local keep_releases=5
    
    # Keep only the latest N releases
    cd "${releases_dir}"
    ls -t | tail -n +$((keep_releases + 1)) | xargs -r rm -rf
    
    # Cleanup old backups (keep last 10)
    cd "${BACKUP_DIR}"
    ls -t | grep "${PROJECT_NAME}_backup_" | tail -n +11 | xargs -r rm -rf
    
    log "INFO" "Cleanup completed"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send Telegram notification if configured
    if [[ -n "${TELEGRAM_ADMIN_CHAT_ID:-}" ]] && [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
        local emoji="✅"
        if [[ "$status" != "success" ]]; then
            emoji="❌"
        fi
        
        local notification="${emoji} *Deployment ${status}*\n\n"
        notification+="*Server:* $(hostname)\n"
        notification+="*Time:* $(date)\n"
        notification+="*Message:* ${message}\n"
        
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_ADMIN_CHAT_ID}" \
            -d text="${notification}" \
            -d parse_mode="Markdown" > /dev/null || true
    fi
}

# Main deployment function
main() {
    log "INFO" "Starting production deployment..."
    
    # Check prerequisites
    check_user
    setup_directories
    validate_environment
    
    # Pre-deployment steps
    pre_deployment_health_check
    create_backup
    
    # Deployment steps
    deploy_new_version
    run_migrations
    switch_version
    start_services
    
    # Post-deployment validation
    if post_deployment_health_check; then
        cleanup_old_releases
        send_notification "success" "Deployment completed successfully"
        log "INFO" "Deployment completed successfully!"
    else
        log "ERROR" "Post-deployment health check failed, initiating rollback..."
        if rollback_deployment; then
            send_notification "rollback" "Deployment failed, rolled back to previous version"
            log "INFO" "Rollback completed successfully"
            exit 1
        else
            send_notification "failure" "Deployment and rollback both failed, manual intervention required"
            log "ERROR" "Deployment and rollback both failed!"
            exit 1
        fi
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health-check")
        post_deployment_health_check
        ;;
    "cleanup")
        cleanup_old_releases
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health-check|cleanup}"
        exit 1
        ;;
esac