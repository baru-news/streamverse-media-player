#!/bin/bash

# Phase 1: Bot Environment Setup Script
# Run this script as root: bash bot_environment.sh

set -e  # Exit on any error

echo "=== PHASE 1: BOT ENVIRONMENT SETUP ==="
echo "Starting bot-specific environment configuration..."

# Create comprehensive directory structure
echo "Creating bot directory structure..."
mkdir -p /opt/telegram-bot/config \
         /opt/telegram-bot/logs \
         /opt/telegram-bot/scripts \
         /opt/telegram-bot/backups \
         /opt/telegram-bot/tmp \
         /opt/telegram-bot/sessions \
         /opt/telegram-bot/uploads \
         /opt/telegram-bot/downloads \
         /opt/telegram-bot/data \
         /opt/telegram-bot/templates \
         /opt/telegram-bot/static

# Set proper ownership
chown -R telegram-bot:telegram-bot /opt/telegram-bot

# Create logging configuration
cat > /opt/telegram-bot/config/logging.yaml << 'EOF'
version: 1
disable_existing_loggers: false

formatters:
  standard:
    format: '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    datefmt: '%Y-%m-%d %H:%M:%S'
  detailed:
    format: '%(asctime)s [%(levelname)s] %(name)s [%(filename)s:%(lineno)d]: %(message)s'
    datefmt: '%Y-%m-%d %H:%M:%S'

handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: standard
    stream: ext://sys.stdout
  
  file:
    class: logging.handlers.RotatingFileHandler
    level: INFO
    formatter: detailed
    filename: /opt/telegram-bot/logs/bot.log
    maxBytes: 10485760  # 10MB
    backupCount: 5
  
  error_file:
    class: logging.handlers.RotatingFileHandler
    level: ERROR
    formatter: detailed
    filename: /opt/telegram-bot/logs/error.log
    maxBytes: 10485760  # 10MB
    backupCount: 3

loggers:
  pyrogram:
    level: INFO
    handlers: [console, file]
    propagate: false
  
  telegram_bot:
    level: DEBUG
    handlers: [console, file, error_file]
    propagate: false

root:
  level: INFO
  handlers: [console, file]
EOF

# Create configuration file template
cat > /opt/telegram-bot/config/bot_config.yaml << 'EOF'
# Telegram Bot Configuration

# Telegram API Settings
telegram:
  api_id: ${TELEGRAM_API_ID}
  api_hash: ${TELEGRAM_API_HASH}
  session_name: ${TELEGRAM_SESSION_NAME}
  phone_number: ${TELEGRAM_PHONE_NUMBER}
  device_model: "Telegram Bot Server"
  system_version: "Ubuntu 22.04"
  app_version: "1.0.0"
  lang_code: "en"

# Doodstream API Settings
doodstream:
  regular_api_key: ${DOODSTREAM_API_KEY_REGULAR}
  premium_api_key: ${DOODSTREAM_API_KEY_PREMIUM}
  base_url: "https://doodapi.com/api"
  upload_timeout: 300
  max_retries: 3

# Supabase Settings
supabase:
  url: ${SUPABASE_URL}
  service_key: ${SUPABASE_SERVICE_KEY}
  timeout: 30

# File Handling Settings
files:
  max_size: 2147483648  # 2GB
  chunk_size: 1048576   # 1MB
  temp_dir: "/opt/telegram-bot/tmp"
  max_concurrent_downloads: 3
  max_concurrent_uploads: 2
  supported_formats:
    - "mp4"
    - "mkv"
    - "avi"
    - "mov"
    - "wmv"
    - "flv"
    - "webm"
    - "m4v"

# Bot Behavior Settings
bot:
  admin_user_ids: ${ADMIN_USER_IDS}
  max_retries: 3
  retry_delay: 5
  progress_update_interval: 10
  cleanup_temp_files: true
  auto_delete_processed: true

# Monitoring Settings
monitoring:
  enable_web_dashboard: ${ENABLE_WEB_DASHBOARD}
  dashboard_host: ${WEB_DASHBOARD_HOST}
  dashboard_port: ${WEB_DASHBOARD_PORT}
  collect_metrics: true
  metrics_interval: 60

# Logging Settings
logging:
  level: ${LOG_LEVEL}
  file: ${LOG_FILE}
  max_size: ${LOG_MAX_SIZE}
  backup_count: ${LOG_BACKUP_COUNT}
  console_output: true
EOF

# Create system monitoring configuration
cat > /opt/telegram-bot/config/monitoring.yaml << 'EOF'
# System Monitoring Configuration

# Resource Limits
limits:
  max_memory_usage: 80  # Percentage
  max_disk_usage: 85    # Percentage
  max_cpu_usage: 90     # Percentage
  max_temp_files: 100   # Number of files

# Health Checks
health_checks:
  interval: 300  # 5 minutes
  checks:
    - database_connection
    - telegram_api_connection
    - doodstream_api_connection
    - disk_space
    - memory_usage
    - temp_file_cleanup

# Alerts
alerts:
  enable_logging: true
  log_file: /opt/telegram-bot/logs/alerts.log
  
# Cleanup Settings
cleanup:
  temp_files_older_than: 3600  # 1 hour
  log_files_older_than: 2592000  # 30 days
  backup_files_older_than: 1209600  # 14 days
EOF

# Create startup script
cat > /opt/telegram-bot/start_bot.sh << 'EOF'
#!/bin/bash
# Telegram Bot Startup Script

set -e

BOT_DIR="/opt/telegram-bot"
VENV_DIR="$BOT_DIR/venv"
LOG_FILE="$BOT_DIR/logs/startup.log"

echo "$(date): Starting Telegram Bot..." >> $LOG_FILE

# Check if running as correct user
if [ "$(whoami)" != "telegram-bot" ]; then
    echo "Error: This script must be run as telegram-bot user"
    echo "Run: su - telegram-bot -c '/opt/telegram-bot/start_bot.sh'"
    exit 1
fi

# Change to bot directory
cd $BOT_DIR

# Activate virtual environment
source $VENV_DIR/bin/activate

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found"
fi

# Check if bot.py exists
if [ ! -f "bot.py" ]; then
    echo "Error: bot.py not found in $BOT_DIR"
    exit 1
fi

# Create necessary directories
mkdir -p logs tmp sessions uploads downloads

# Check dependencies
python -c "import pyrogram, aiohttp, supabase" || {
    echo "Error: Required dependencies not installed"
    exit 1
}

# Start the bot
echo "$(date): Bot starting..." >> $LOG_FILE
python bot.py

echo "$(date): Bot stopped" >> $LOG_FILE
EOF

chmod +x /opt/telegram-bot/start_bot.sh

# Create stop script
cat > /opt/telegram-bot/stop_bot.sh << 'EOF'
#!/bin/bash
# Telegram Bot Stop Script

BOT_DIR="/opt/telegram-bot"
LOG_FILE="$BOT_DIR/logs/startup.log"

echo "$(date): Stopping Telegram Bot..." >> $LOG_FILE

# Find and kill bot process
BOT_PID=$(pgrep -f "python.*bot.py" || echo "")

if [ -n "$BOT_PID" ]; then
    echo "Found bot process: $BOT_PID"
    kill -TERM $BOT_PID
    
    # Wait for graceful shutdown
    sleep 5
    
    # Force kill if still running
    if kill -0 $BOT_PID 2>/dev/null; then
        echo "Force killing bot process: $BOT_PID"
        kill -KILL $BOT_PID
    fi
    
    echo "$(date): Bot stopped (PID: $BOT_PID)" >> $LOG_FILE
else
    echo "No bot process found"
    echo "$(date): No bot process found" >> $LOG_FILE
fi
EOF

chmod +x /opt/telegram-bot/stop_bot.sh

# Create status script
cat > /opt/telegram-bot/status_bot.sh << 'EOF'
#!/bin/bash
# Telegram Bot Status Script

BOT_DIR="/opt/telegram-bot"

echo "=== TELEGRAM BOT STATUS ==="

# Check if process is running
BOT_PID=$(pgrep -f "python.*bot.py" || echo "")

if [ -n "$BOT_PID" ]; then
    echo "✅ Bot is RUNNING (PID: $BOT_PID)"
    
    # Show process info
    echo ""
    echo "Process Info:"
    ps -p $BOT_PID -o pid,ppid,cmd,etime,pcpu,pmem
    
    # Show network connections
    echo ""
    echo "Network Connections:"
    netstat -tulpn | grep $BOT_PID || echo "No network connections found"
    
else
    echo "❌ Bot is NOT running"
fi

# Show system resources
echo ""
echo "System Resources:"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"

# Show recent logs
echo ""
echo "Recent Logs (last 10 lines):"
if [ -f "$BOT_DIR/logs/bot.log" ]; then
    tail -10 "$BOT_DIR/logs/bot.log"
else
    echo "No logs found"
fi

# Show log file sizes
echo ""
echo "Log Files:"
if [ -d "$BOT_DIR/logs" ]; then
    ls -lh "$BOT_DIR/logs/"
else
    echo "No log directory found"
fi
EOF

chmod +x /opt/telegram-bot/status_bot.sh

# Set proper ownership for all scripts
chown -R telegram-bot:telegram-bot /opt/telegram-bot

# Create systemd service management scripts
cat > /opt/telegram-bot/scripts/service_manager.sh << 'EOF'
#!/bin/bash
# Systemd Service Management Script

SERVICE_NAME="telegram-bot"

case "$1" in
    start)
        echo "Starting $SERVICE_NAME service..."
        sudo systemctl start $SERVICE_NAME
        sudo systemctl status $SERVICE_NAME --no-pager
        ;;
    stop)
        echo "Stopping $SERVICE_NAME service..."
        sudo systemctl stop $SERVICE_NAME
        ;;
    restart)
        echo "Restarting $SERVICE_NAME service..."
        sudo systemctl restart $SERVICE_NAME
        sudo systemctl status $SERVICE_NAME --no-pager
        ;;
    status)
        sudo systemctl status $SERVICE_NAME --no-pager
        ;;
    enable)
        echo "Enabling $SERVICE_NAME service..."
        sudo systemctl enable $SERVICE_NAME
        ;;
    disable)
        echo "Disabling $SERVICE_NAME service..."
        sudo systemctl disable $SERVICE_NAME
        ;;
    logs)
        echo "Showing $SERVICE_NAME logs..."
        sudo journalctl -u $SERVICE_NAME -f
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|enable|disable|logs}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/telegram-bot/scripts/service_manager.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/service_manager.sh

# Create comprehensive backup script
cat > /opt/telegram-bot/scripts/backup.sh << 'EOF'
#!/bin/bash
# Comprehensive Backup Script

BACKUP_DIR="/opt/telegram-bot/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BOT_DIR="/opt/telegram-bot"

echo "Starting backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR/daily"

# Backup configuration files
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/daily/config_$DATE.tar.gz" \
    -C "$BOT_DIR" \
    config/ \
    .env 2>/dev/null || true

# Backup session files
echo "Backing up sessions..."
if [ -d "$BOT_DIR/sessions" ]; then
    tar -czf "$BACKUP_DIR/daily/sessions_$DATE.tar.gz" \
        -C "$BOT_DIR" \
        sessions/
fi

# Backup logs (last 7 days)
echo "Backing up recent logs..."
find "$BOT_DIR/logs" -name "*.log" -mtime -7 -exec tar -czf "$BACKUP_DIR/daily/logs_$DATE.tar.gz" {} + 2>/dev/null || true

# Backup custom scripts and data
echo "Backing up scripts and data..."
tar -czf "$BACKUP_DIR/daily/scripts_data_$DATE.tar.gz" \
    -C "$BOT_DIR" \
    scripts/ \
    data/ 2>/dev/null || true

# Clean up old backups (keep last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR/daily" -name "*.tar.gz" -mtime +7 -delete

# Show backup summary
echo ""
echo "Backup completed at $(date)"
echo "Backup files:"
ls -lh "$BACKUP_DIR/daily/"*_$DATE.tar.gz 2>/dev/null || echo "No backup files created"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
echo "Total backup directory size: $TOTAL_SIZE"
EOF

chmod +x /opt/telegram-bot/scripts/backup.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/backup.sh

# Setup cron job for daily backups
echo "Setting up daily backup cron job..."
(crontab -u telegram-bot -l 2>/dev/null; echo "0 3 * * * /opt/telegram-bot/scripts/backup.sh >> /opt/telegram-bot/logs/backup.log 2>&1") | crontab -u telegram-bot -

# Create environment check script
cat > /opt/telegram-bot/scripts/check_environment.sh << 'EOF'
#!/bin/bash
# Environment Check Script

echo "=== TELEGRAM BOT ENVIRONMENT CHECK ==="

# Check user
echo "Current user: $(whoami)"

# Check directories
echo ""
echo "Directory Structure:"
ls -la /opt/telegram-bot/

# Check virtual environment
echo ""
echo "Virtual Environment:"
if [ -d "/opt/telegram-bot/venv" ]; then
    echo "✅ Virtual environment exists"
    source /opt/telegram-bot/venv/bin/activate
    echo "Python: $(python --version)"
    echo "Pip: $(pip --version)"
    echo "Installed packages: $(pip list | wc -l)"
else
    echo "❌ Virtual environment not found"
fi

# Check configuration files
echo ""
echo "Configuration Files:"
for file in .env config/bot_config.yaml config/logging.yaml; do
    if [ -f "/opt/telegram-bot/$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check permissions
echo ""
echo "Permissions:"
ls -la /opt/telegram-bot/ | head -5

# Check system service
echo ""
echo "System Service:"
if systemctl is-active --quiet telegram-bot; then
    echo "✅ Service is active"
else
    echo "ℹ️  Service is inactive (normal during setup)"
fi

# Check log files
echo ""
echo "Log Files:"
if [ -d "/opt/telegram-bot/logs" ]; then
    ls -la /opt/telegram-bot/logs/ || echo "No log files yet"
else
    echo "❌ Log directory not found"
fi

echo ""
echo "Environment check completed!"
EOF

chmod +x /opt/telegram-bot/scripts/check_environment.sh
chown telegram-bot:telegram-bot /opt/telegram-bot/scripts/check_environment.sh

# Run environment check
echo "Running environment check..."
su - telegram-bot -c "/opt/telegram-bot/scripts/check_environment.sh"

echo "=== BOT ENVIRONMENT SETUP COMPLETED ==="
echo ""
echo "✅ Directory structure created"
echo "✅ Configuration templates ready"
echo "✅ Logging system configured"
echo "✅ Management scripts installed"
echo "✅ Backup system configured"
echo "✅ Systemd service ready"
echo ""
echo "Available management commands:"
echo "  - /opt/telegram-bot/start_bot.sh     (start bot manually)"
echo "  - /opt/telegram-bot/stop_bot.sh      (stop bot)"
echo "  - /opt/telegram-bot/status_bot.sh    (check status)"
echo "  - /opt/telegram-bot/scripts/service_manager.sh start  (systemd service)"
echo "  - /opt/telegram-bot/scripts/backup.sh  (manual backup)"
echo "  - /opt/telegram-bot/scripts/check_environment.sh  (verify setup)"
echo ""
echo "Next steps:"
echo "1. Copy .env.template to .env and configure your API keys"
echo "2. Proceed to Phase 2: Telegram User Bot Development"
echo ""
echo "=== PHASE 1 COMPLETED SUCCESSFULLY ==="