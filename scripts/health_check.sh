#!/bin/bash
set -euo pipefail

# Comprehensive Health Check Script for Telegram Bot
# Performs detailed system and application health validation

# Configuration
HEALTH_CHECK_TIMEOUT=30
LOG_FILE="/var/log/telegram-bot/health_check.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check results
declare -A health_results
overall_status="healthy"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "${timestamp} [${level}] ${message}" >> "${LOG_FILE}"
    
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

# Set overall status
set_status() {
    local new_status=$1
    
    case $new_status in
        "critical")
            overall_status="critical"
            ;;
        "warning")
            if [[ "$overall_status" != "critical" ]]; then
                overall_status="warning"
            fi
            ;;
        "healthy")
            if [[ "$overall_status" == "unknown" ]]; then
                overall_status="healthy"
            fi
            ;;
    esac
}

# System resource checks
check_system_resources() {
    log "INFO" "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    cpu_usage=$(echo "$cpu_usage" | tr -d 'a-zA-Z%')
    
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        health_results["cpu"]="CRITICAL: CPU usage at ${cpu_usage}%"
        set_status "critical"
    elif (( $(echo "$cpu_usage > 60" | bc -l) )); then
        health_results["cpu"]="WARNING: CPU usage at ${cpu_usage}%"
        set_status "warning"
    else
        health_results["cpu"]="OK: CPU usage at ${cpu_usage}%"
    fi
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_percent=$(( (used_memory * 100) / total_memory ))
    
    if [[ $memory_percent -gt $ALERT_THRESHOLD_MEMORY ]]; then
        health_results["memory"]="CRITICAL: Memory usage at ${memory_percent}%"
        set_status "critical"
    elif [[ $memory_percent -gt 70 ]]; then
        health_results["memory"]="WARNING: Memory usage at ${memory_percent}%"
        set_status "warning"
    else
        health_results["memory"]="OK: Memory usage at ${memory_percent}%"
    fi
    
    # Disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -gt $ALERT_THRESHOLD_DISK ]]; then
        health_results["disk"]="CRITICAL: Disk usage at ${disk_usage}%"
        set_status "critical"
    elif [[ $disk_usage -gt 80 ]]; then
        health_results["disk"]="WARNING: Disk usage at ${disk_usage}%"
        set_status "warning"
    else
        health_results["disk"]="OK: Disk usage at ${disk_usage}%"
    fi
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_ratio=$(echo "scale=2; $load_avg / $cpu_cores" | bc)
    
    if (( $(echo "$load_ratio > 2.0" | bc -l) )); then
        health_results["load"]="CRITICAL: Load average ${load_avg} (ratio: ${load_ratio})"
        set_status "critical"
    elif (( $(echo "$load_ratio > 1.0" | bc -l) )); then
        health_results["load"]="WARNING: Load average ${load_avg} (ratio: ${load_ratio})"
        set_status "warning"
    else
        health_results["load"]="OK: Load average ${load_avg} (ratio: ${load_ratio})"
    fi
}

# Service status checks
check_service_status() {
    log "INFO" "Checking service status..."
    
    # Check if bot service is running
    if systemctl --user is-active --quiet telegram-userbot; then
        health_results["bot_service"]="OK: Bot service is running"
        
        # Check service start time
        local start_time=$(systemctl --user show telegram-userbot --property=ActiveEnterTimestamp --value)
        health_results["bot_uptime"]="INFO: Bot started at ${start_time}"
    else
        health_results["bot_service"]="CRITICAL: Bot service is not running"
        set_status "critical"
    fi
    
    # Check for service failures
    local failed_services=$(systemctl --user --failed --no-legend | wc -l)
    if [[ $failed_services -gt 0 ]]; then
        health_results["failed_services"]="WARNING: ${failed_services} failed services detected"
        set_status "warning"
    else
        health_results["failed_services"]="OK: No failed services"
    fi
}

# Network connectivity checks
check_network_connectivity() {
    log "INFO" "Checking network connectivity..."
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        health_results["internet"]="OK: Internet connectivity available"
    else
        health_results["internet"]="CRITICAL: No internet connectivity"
        set_status "critical"
    fi
    
    # Check Telegram API
    if curl -s --connect-timeout 10 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN:-dummy}/getMe" | grep -q '"ok":true'; then
        health_results["telegram_api"]="OK: Telegram API accessible"
    else
        health_results["telegram_api"]="CRITICAL: Telegram API not accessible"
        set_status "critical"
    fi
    
    # Check Supabase connectivity
    if [[ -n "${SUPABASE_URL:-}" ]]; then
        if curl -s --connect-timeout 10 "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_ANON_KEY:-}" | grep -q "swagger"; then
            health_results["supabase"]="OK: Supabase API accessible"
        else
            health_results["supabase"]="CRITICAL: Supabase API not accessible"
            set_status "critical"
        fi
    else
        health_results["supabase"]="WARNING: Supabase URL not configured"
        set_status "warning"
    fi
    
    # Check Doodstream API
    if [[ -n "${DOODSTREAM_API_KEY:-}" ]]; then
        if curl -s --connect-timeout 10 "https://doodapi.com/api/account/info?key=${DOODSTREAM_API_KEY}" | grep -q '"status":200'; then
            health_results["doodstream"]="OK: Doodstream API accessible"
        else
            health_results["doodstream"]="WARNING: Doodstream API not accessible"
            set_status "warning"
        fi
    else
        health_results["doodstream"]="INFO: Doodstream API key not configured"
    fi
}

# Application-specific checks
check_application_health() {
    log "INFO" "Checking application health..."
    
    # Check if bot is responsive
    if [[ -f "/opt/telegram-userbot/current/telegram_userbot/main.py" ]]; then
        health_results["bot_files"]="OK: Bot files present"
        
        # Try to import bot modules
        if python3 -c "
import sys
sys.path.append('/opt/telegram-userbot/current')
try:
    from telegram_userbot.utils.telegram_bot import TelegramBot
    print('Import successful')
except Exception as e:
    print(f'Import failed: {e}')
    exit(1)
        " &> /dev/null; then
            health_results["bot_modules"]="OK: Bot modules importable"
        else
            health_results["bot_modules"]="CRITICAL: Bot modules not importable"
            set_status "critical"
        fi
    else
        health_results["bot_files"]="CRITICAL: Bot files missing"
        set_status "critical"
    fi
    
    # Check log files
    local log_dir="/opt/telegram-userbot/current/logs"
    if [[ -d "$log_dir" ]]; then
        local recent_logs=$(find "$log_dir" -name "*.log" -mtime -1 | wc -l)
        if [[ $recent_logs -gt 0 ]]; then
            health_results["log_files"]="OK: Recent log files found ($recent_logs)"
        else
            health_results["log_files"]="WARNING: No recent log files"
            set_status "warning"
        fi
        
        # Check for errors in recent logs
        local error_count=$(find "$log_dir" -name "*.log" -mtime -1 -exec grep -l "ERROR\|CRITICAL" {} \; | wc -l)
        if [[ $error_count -gt 0 ]]; then
            health_results["log_errors"]="WARNING: Error entries found in $error_count log files"
            set_status "warning"
        else
            health_results["log_errors"]="OK: No recent errors in logs"
        fi
    else
        health_results["log_files"]="WARNING: Log directory not found"
        set_status "warning"
    fi
}

# Database checks
check_database_health() {
    log "INFO" "Checking database health..."
    
    if python3 -c "
import asyncio
import os
import sys
from supabase import create_client

async def check_database():
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL', ''),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
        )
        
        # Test basic query
        result = await supabase.table('profiles').select('count').limit(1).execute()
        print('Database query successful')
        
        # Check recent activity
        from datetime import datetime, timedelta
        recent_time = datetime.utcnow() - timedelta(hours=1)
        
        uploads_result = await supabase.table('telegram_uploads').select('id').gte('created_at', recent_time.isoformat()).execute()
        upload_count = len(uploads_result.data) if uploads_result.data else 0
        print(f'Recent uploads: {upload_count}')
        
        return True
    except Exception as e:
        print(f'Database check failed: {e}')
        return False

result = asyncio.run(check_database())
exit(0 if result else 1)
    "; then
        health_results["database"]="OK: Database accessible and responsive"
    else
        health_results["database"]="CRITICAL: Database connection failed"
        set_status "critical"
    fi
}

# Security checks
check_security() {
    log "INFO" "Checking security status..."
    
    # Check file permissions
    local bot_dir="/opt/telegram-userbot/current"
    if [[ -d "$bot_dir" ]]; then
        local wrong_perms=$(find "$bot_dir" -type f -perm /o+w 2>/dev/null | wc -l)
        if [[ $wrong_perms -gt 0 ]]; then
            health_results["file_permissions"]="WARNING: $wrong_perms files with world-writable permissions"
            set_status "warning"
        else
            health_results["file_permissions"]="OK: File permissions secure"
        fi
    fi
    
    # Check for suspicious processes
    local suspicious_procs=$(ps aux | grep -E "(nc|netcat|telnet|ssh)" | grep -v grep | wc -l)
    if [[ $suspicious_procs -gt 2 ]]; then
        health_results["suspicious_processes"]="WARNING: $suspicious_procs potentially suspicious processes"
        set_status "warning"
    else
        health_results["suspicious_processes"]="OK: No suspicious processes detected"
    fi
    
    # Check firewall status
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            health_results["firewall"]="OK: Firewall is active"
        else
            health_results["firewall"]="WARNING: Firewall is not active"
            set_status "warning"
        fi
    else
        health_results["firewall"]="INFO: UFW not installed"
    fi
}

# Performance checks
check_performance() {
    log "INFO" "Checking performance metrics..."
    
    # Check I/O wait
    local io_wait=$(top -bn1 | grep "Cpu(s)" | awk '{print $10}' | sed 's/%wa,//')
    io_wait=$(echo "$io_wait" | tr -d 'a-zA-Z%')
    
    if (( $(echo "$io_wait > 30" | bc -l) )); then
        health_results["io_wait"]="CRITICAL: High I/O wait at ${io_wait}%"
        set_status "critical"
    elif (( $(echo "$io_wait > 15" | bc -l) )); then
        health_results["io_wait"]="WARNING: Elevated I/O wait at ${io_wait}%"
        set_status "warning"
    else
        health_results["io_wait"]="OK: I/O wait at ${io_wait}%"
    fi
    
    # Check swap usage
    local swap_usage=$(free | grep Swap | awk '{if ($2 > 0) print ($3/$2)*100; else print 0}')
    swap_usage=$(printf "%.0f" "$swap_usage")
    
    if [[ $swap_usage -gt 50 ]]; then
        health_results["swap"]="WARNING: High swap usage at ${swap_usage}%"
        set_status "warning"
    else
        health_results["swap"]="OK: Swap usage at ${swap_usage}%"
    fi
    
    # Check open file descriptors
    local max_fds=$(ulimit -n)
    local current_fds=$(lsof 2>/dev/null | wc -l)
    local fd_usage=$(( (current_fds * 100) / max_fds ))
    
    if [[ $fd_usage -gt 80 ]]; then
        health_results["file_descriptors"]="WARNING: High file descriptor usage at ${fd_usage}%"
        set_status "warning"
    else
        health_results["file_descriptors"]="OK: File descriptor usage at ${fd_usage}%"
    fi
}

# Generate health report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "=========================================="
    echo "TELEGRAM BOT HEALTH CHECK REPORT"
    echo "Generated: $timestamp"
    echo "Overall Status: $(echo $overall_status | tr '[:lower:]' '[:upper:]')"
    echo "=========================================="
    echo
    
    # Group results by category
    echo "SYSTEM RESOURCES:"
    for key in cpu memory disk load; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    echo "SERVICES:"
    for key in bot_service bot_uptime failed_services; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    echo "NETWORK CONNECTIVITY:"
    for key in internet telegram_api supabase doodstream; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    echo "APPLICATION:"
    for key in bot_files bot_modules log_files log_errors database; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    echo "SECURITY:"
    for key in file_permissions suspicious_processes firewall; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    echo "PERFORMANCE:"
    for key in io_wait swap file_descriptors; do
        if [[ -n "${health_results[$key]:-}" ]]; then
            echo "  $key: ${health_results[$key]}"
        fi
    done
    echo
    
    # Recommendations
    echo "RECOMMENDATIONS:"
    case $overall_status in
        "critical")
            echo "  - IMMEDIATE ACTION REQUIRED: Critical issues detected"
            echo "  - Check system resources and restart services if necessary"
            echo "  - Review error logs and fix connectivity issues"
            ;;
        "warning")
            echo "  - Monitor system closely for potential issues"
            echo "  - Consider preventive maintenance"
            echo "  - Review warning items and plan corrective actions"
            ;;
        "healthy")
            echo "  - System is operating normally"
            echo "  - Continue regular monitoring"
            ;;
    esac
    echo
}

# Send health status to monitoring system
send_health_status() {
    if [[ -n "${HEALTH_WEBHOOK_URL:-}" ]]; then
        local json_payload=$(cat << EOF
{
  "timestamp": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "overall_status": "$overall_status",
  "checks": {
$(for key in "${!health_results[@]}"; do
    echo "    \"$key\": \"${health_results[$key]}\","
done | sed '$ s/,$//')
  }
}
EOF
)
        
        curl -s -X POST "$HEALTH_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$json_payload" > /dev/null || true
    fi
}

# Main function
main() {
    log "INFO" "Starting comprehensive health check..."
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Initialize overall status
    overall_status="unknown"
    
    # Run all health checks
    check_system_resources
    check_service_status
    check_network_connectivity
    check_application_health
    check_database_health
    check_security
    check_performance
    
    # Generate and display report
    generate_report
    
    # Send status to monitoring system
    send_health_status
    
    log "INFO" "Health check completed with status: $overall_status"
    
    # Exit with appropriate code
    case $overall_status in
        "healthy")
            exit 0
            ;;
        "warning")
            exit 1
            ;;
        "critical")
            exit 2
            ;;
        *)
            exit 3
            ;;
    esac
}

# Handle script arguments
case "${1:-full}" in
    "full"|"all")
        main
        ;;
    "quick")
        check_service_status
        check_network_connectivity
        generate_report
        exit $?
        ;;
    "system")
        check_system_resources
        check_performance
        generate_report
        exit $?
        ;;
    "services")
        check_service_status
        check_application_health
        generate_report
        exit $?
        ;;
    *)
        echo "Usage: $0 {full|quick|system|services}"
        echo "  full     - Complete health check (default)"
        echo "  quick    - Basic service and connectivity check"
        echo "  system   - System resources and performance only"
        echo "  services - Service status and application health only"
        exit 1
        ;;
esac