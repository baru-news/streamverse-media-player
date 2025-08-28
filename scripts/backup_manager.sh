#!/bin/bash
set -euo pipefail

# Comprehensive Backup Management System for Telegram Bot
# Handles automated backups of configuration, sessions, logs, and database metadata

# Configuration
BACKUP_BASE_DIR="/opt/telegram-userbot/backups"
S3_BUCKET="${AWS_S3_BUCKET:-telegram-bot-backups}"
RETENTION_DAYS=30
ENCRYPTION_KEY_FILE="/opt/telegram-userbot/config/backup_key"
COMPRESSION_LEVEL=9

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "${timestamp} [${level}] ${message}" | tee -a "${BACKUP_BASE_DIR}/backup.log"
    
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

# Initialize backup environment
init_backup_env() {
    log "INFO" "Initializing backup environment..."
    
    # Create backup directories
    mkdir -p "${BACKUP_BASE_DIR}"/{daily,weekly,monthly,emergency}
    mkdir -p "${BACKUP_BASE_DIR}/temp"
    
    # Generate encryption key if not exists
    if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
        log "INFO" "Generating new backup encryption key..."
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
    fi
    
    # Check dependencies
    for cmd in tar gzip openssl aws; do
        if ! command -v "$cmd" &> /dev/null; then
            log "WARN" "$cmd not found, some features may not work"
        fi
    done
}

# Create encrypted archive
create_encrypted_archive() {
    local source_dir=$1
    local output_file=$2
    local description=$3
    
    log "INFO" "Creating encrypted archive: $description"
    
    local temp_archive="${BACKUP_BASE_DIR}/temp/$(basename "$output_file" .enc)"
    
    # Create compressed archive
    tar -czf "$temp_archive" -C "$(dirname "$source_dir")" "$(basename "$source_dir")" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        # Encrypt the archive
        openssl enc -aes-256-cbc -salt -in "$temp_archive" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE"
        
        # Clean up temp file
        rm -f "$temp_archive"
        
        # Verify archive
        if [[ -f "$output_file" ]]; then
            local size=$(du -h "$output_file" | cut -f1)
            log "INFO" "Archive created successfully: $output_file ($size)"
            return 0
        else
            log "ERROR" "Failed to create encrypted archive: $output_file"
            return 1
        fi
    else
        log "ERROR" "Failed to create tar archive for: $source_dir"
        return 1
    fi
}

# Backup configuration files
backup_configuration() {
    log "INFO" "Backing up configuration files..."
    
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local config_backup="${BACKUP_BASE_DIR}/daily/config_${backup_date}.tar.gz.enc"
    
    # Create temporary config directory
    local temp_config="${BACKUP_BASE_DIR}/temp/config_${backup_date}"
    mkdir -p "$temp_config"
    
    # Copy configuration files
    if [[ -d "/opt/telegram-userbot/config" ]]; then
        cp -r "/opt/telegram-userbot/config" "$temp_config/"
    fi
    
    # Copy systemd service files
    if [[ -f "$HOME/.config/systemd/user/telegram-userbot.service" ]]; then
        mkdir -p "$temp_config/systemd"
        cp "$HOME/.config/systemd/user/telegram-userbot.service" "$temp_config/systemd/"
    fi
    
    # Copy environment files
    if [[ -f "/opt/telegram-userbot/.env" ]]; then
        cp "/opt/telegram-userbot/.env" "$temp_config/"
    fi
    
    # Create metadata
    cat > "$temp_config/backup_metadata.json" << EOF
{
  "backup_type": "configuration",
  "timestamp": "$(date -Iseconds)",
  "hostname": "$(hostname)",
  "user": "$(whoami)",
  "git_commit": "$(cd /opt/telegram-userbot && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "system_info": {
    "os": "$(uname -s)",
    "kernel": "$(uname -r)",
    "architecture": "$(uname -m)"
  }
}
EOF
    
    # Create encrypted archive
    if create_encrypted_archive "$temp_config" "$config_backup" "Configuration files"; then
        rm -rf "$temp_config"
        echo "$config_backup" > "${BACKUP_BASE_DIR}/latest_config_backup"
        return 0
    else
        rm -rf "$temp_config"
        return 1
    fi
}

# Backup session files
backup_sessions() {
    log "INFO" "Backing up session files..."
    
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local sessions_backup="${BACKUP_BASE_DIR}/daily/sessions_${backup_date}.tar.gz.enc"
    
    local sessions_dir="/opt/telegram-userbot/sessions"
    if [[ -d "$sessions_dir" ]]; then
        if create_encrypted_archive "$sessions_dir" "$sessions_backup" "Session files"; then
            echo "$sessions_backup" > "${BACKUP_BASE_DIR}/latest_sessions_backup"
            return 0
        else
            return 1
        fi
    else
        log "WARN" "Sessions directory not found: $sessions_dir"
        return 0
    fi
}

# Backup logs with rotation
backup_logs() {
    log "INFO" "Backing up log files..."
    
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local logs_backup="${BACKUP_BASE_DIR}/daily/logs_${backup_date}.tar.gz.enc"
    
    local logs_dir="/opt/telegram-userbot/logs"
    if [[ -d "$logs_dir" ]]; then
        # Create temporary logs directory with only recent files
        local temp_logs="${BACKUP_BASE_DIR}/temp/logs_${backup_date}"
        mkdir -p "$temp_logs"
        
        # Copy logs from last 7 days
        find "$logs_dir" -type f -name "*.log" -mtime -7 -exec cp {} "$temp_logs/" \;
        
        # Compress older logs separately
        find "$logs_dir" -type f -name "*.log" -mtime +7 -mtime -30 | while read -r logfile; do
            if [[ ! "$logfile" =~ \.gz$ ]]; then
                gzip -c "$logfile" > "$temp_logs/$(basename "$logfile").gz"
            fi
        done
        
        if create_encrypted_archive "$temp_logs" "$logs_backup" "Log files"; then
            rm -rf "$temp_logs"
            echo "$logs_backup" > "${BACKUP_BASE_DIR}/latest_logs_backup"
            return 0
        else
            rm -rf "$temp_logs"
            return 1
        fi
    else
        log "WARN" "Logs directory not found: $logs_dir"
        return 0
    fi
}

# Backup database metadata
backup_database_metadata() {
    log "INFO" "Backing up database metadata..."
    
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local db_backup="${BACKUP_BASE_DIR}/daily/database_metadata_${backup_date}.tar.gz.enc"
    
    local temp_db="${BACKUP_BASE_DIR}/temp/database_${backup_date}"
    mkdir -p "$temp_db"
    
    # Export database schema and statistics
    python3 << EOF
import asyncio
import json
import os
from supabase import create_client

async def export_metadata():
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        
        metadata = {
            'export_timestamp': '$(date -Iseconds)',
            'tables': {},
            'statistics': {}
        }
        
        # Export table schemas and row counts
        tables = [
            'profiles', 'videos', 'telegram_uploads', 'user_coins',
            'user_badges', 'premium_subscriptions', 'daily_tasks',
            'performance_metrics', 'analytics_events'
        ]
        
        for table in tables:
            try:
                # Get sample data structure
                sample = await supabase.table(table).select('*').limit(1).execute()
                if sample.data:
                    metadata['tables'][table] = {
                        'columns': list(sample.data[0].keys()),
                        'sample_record': sample.data[0]
                    }
                
                # Get row count
                count_result = await supabase.table(table).select('count').execute()
                metadata['statistics'][table] = {
                    'row_count': len(count_result.data) if count_result.data else 0
                }
                
                print(f"Exported metadata for table: {table}")
                
            except Exception as e:
                print(f"Failed to export {table}: {e}")
                metadata['tables'][table] = {'error': str(e)}
        
        # Save metadata
        with open('${temp_db}/database_metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print("Database metadata export completed")
        
    except Exception as e:
        print(f"Database metadata export failed: {e}")
        with open('${temp_db}/export_error.txt', 'w') as f:
            f.write(f"Export failed: {e}")

asyncio.run(export_metadata())
EOF
    
    if create_encrypted_archive "$temp_db" "$db_backup" "Database metadata"; then
        rm -rf "$temp_db"
        echo "$db_backup" > "${BACKUP_BASE_DIR}/latest_database_backup"
        return 0
    else
        rm -rf "$temp_db"
        return 1
    fi
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file=$1
    local backup_type=$2
    
    if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
        log "WARN" "AWS credentials not configured, skipping cloud upload"
        return 0
    fi
    
    log "INFO" "Uploading $backup_type to cloud storage..."
    
    local filename=$(basename "$backup_file")
    local s3_key="${backup_type}/$(date '+%Y/%m')/${filename}"
    
    if aws s3 cp "$backup_file" "s3://${S3_BUCKET}/${s3_key}" --storage-class STANDARD_IA; then
        log "INFO" "Successfully uploaded to S3: s3://${S3_BUCKET}/${s3_key}"
        
        # Store cloud backup info
        echo "s3://${S3_BUCKET}/${s3_key}" >> "${BACKUP_BASE_DIR}/cloud_backups.log"
        return 0
    else
        log "ERROR" "Failed to upload to S3: $backup_file"
        return 1
    fi
}

# Create full system backup
create_full_backup() {
    log "INFO" "Creating full system backup..."
    
    local backup_date=$(date '+%Y%m%d_%H%M%S')
    local full_backup_dir="${BACKUP_BASE_DIR}/temp/full_backup_${backup_date}"
    local success_count=0
    local total_count=4
    
    mkdir -p "$full_backup_dir"
    
    # Backup all components
    if backup_configuration; then
        cp "$(cat "${BACKUP_BASE_DIR}/latest_config_backup")" "$full_backup_dir/"
        ((success_count++))
    fi
    
    if backup_sessions; then
        cp "$(cat "${BACKUP_BASE_DIR}/latest_sessions_backup")" "$full_backup_dir/"
        ((success_count++))
    fi
    
    if backup_logs; then
        cp "$(cat "${BACKUP_BASE_DIR}/latest_logs_backup")" "$full_backup_dir/"
        ((success_count++))
    fi
    
    if backup_database_metadata; then
        cp "$(cat "${BACKUP_BASE_DIR}/latest_database_backup")" "$full_backup_dir/"
        ((success_count++))
    fi
    
    # Create full backup archive
    local full_backup="${BACKUP_BASE_DIR}/weekly/full_backup_${backup_date}.tar.gz.enc"
    
    if create_encrypted_archive "$full_backup_dir" "$full_backup" "Full system backup"; then
        rm -rf "$full_backup_dir"
        
        # Upload to cloud
        upload_to_cloud "$full_backup" "full"
        
        log "INFO" "Full backup completed successfully ($success_count/$total_count components)"
        return 0
    else
        rm -rf "$full_backup_dir"
        log "ERROR" "Full backup failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."
    
    local cleanup_count=0
    
    # Cleanup local backups older than retention period
    for backup_type in daily weekly monthly emergency; do
        local backup_dir="${BACKUP_BASE_DIR}/${backup_type}"
        
        if [[ -d "$backup_dir" ]]; then
            while IFS= read -r -d '' backup_file; do
                rm -f "$backup_file"
                ((cleanup_count++))
            done < <(find "$backup_dir" -type f -mtime +${RETENTION_DAYS} -print0)
        fi
    done
    
    # Cleanup cloud backups if AWS CLI is available
    if command -v aws &> /dev/null && [[ -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
        log "INFO" "Cleaning up old cloud backups..."
        
        # This would implement S3 lifecycle policies or manual cleanup
        # For now, just log the intent
        log "INFO" "Cloud backup cleanup should be implemented via S3 lifecycle policies"
    fi
    
    # Cleanup temp directory
    rm -rf "${BACKUP_BASE_DIR}/temp"/*
    
    log "INFO" "Cleanup completed: removed $cleanup_count old backup files"
}

# Restore from backup
restore_backup() {
    local backup_file=$1
    local restore_type=$2
    local target_dir=$3
    
    log "INFO" "Restoring from backup: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        log "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Decrypt and extract
    local temp_archive="${BACKUP_BASE_DIR}/temp/restore_$(date '+%Y%m%d_%H%M%S').tar.gz"
    
    if openssl enc -aes-256-cbc -d -in "$backup_file" -out "$temp_archive" -pass file:"$ENCRYPTION_KEY_FILE"; then
        
        # Create restoration directory
        mkdir -p "$target_dir"
        
        if tar -xzf "$temp_archive" -C "$target_dir"; then
            rm -f "$temp_archive"
            log "INFO" "Restoration completed successfully to: $target_dir"
            return 0
        else
            rm -f "$temp_archive"
            log "ERROR" "Failed to extract backup archive"
            return 1
        fi
    else
        log "ERROR" "Failed to decrypt backup file"
        return 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "INFO" "Verifying backup integrity: $(basename "$backup_file")"
    
    # Test decryption
    local temp_test="${BACKUP_BASE_DIR}/temp/verify_test.tar.gz"
    
    if openssl enc -aes-256-cbc -d -in "$backup_file" -out "$temp_test" -pass file:"$ENCRYPTION_KEY_FILE" 2>/dev/null; then
        
        # Test archive integrity
        if tar -tzf "$temp_test" >/dev/null 2>&1; then
            rm -f "$temp_test"
            log "INFO" "Backup verification successful"
            return 0
        else
            rm -f "$temp_test"
            log "ERROR" "Archive integrity check failed"
            return 1
        fi
    else
        log "ERROR" "Decryption verification failed"
        return 1
    fi
}

# Generate backup report
generate_backup_report() {
    log "INFO" "Generating backup report..."
    
    local report_file="${BACKUP_BASE_DIR}/backup_report_$(date '+%Y%m%d_%H%M%S').txt"
    
    cat > "$report_file" << EOF
TELEGRAM BOT BACKUP REPORT
Generated: $(date)
Hostname: $(hostname)

BACKUP SUMMARY:
EOF
    
    # Count backups by type
    for backup_type in daily weekly monthly emergency; do
        local backup_dir="${BACKUP_BASE_DIR}/${backup_type}"
        if [[ -d "$backup_dir" ]]; then
            local count=$(find "$backup_dir" -type f -name "*.enc" | wc -l)
            local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "0B")
            echo "  ${backup_type}: $count files ($total_size)" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "RECENT BACKUPS:" >> "$report_file"
    
    # List recent backups
    find "${BACKUP_BASE_DIR}" -type f -name "*.enc" -mtime -7 -exec ls -lh {} \; | \
    awk '{print "  " $9 " - " $5 " - " $6 " " $7}' >> "$report_file"
    
    echo "" >> "$report_file"
    echo "CLOUD BACKUPS:" >> "$report_file"
    
    if [[ -f "${BACKUP_BASE_DIR}/cloud_backups.log" ]]; then
        tail -10 "${BACKUP_BASE_DIR}/cloud_backups.log" >> "$report_file"
    else
        echo "  No cloud backups configured" >> "$report_file"
    fi
    
    log "INFO" "Backup report generated: $report_file"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${TELEGRAM_ADMIN_CHAT_ID:-}" ]] && [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
        local emoji="✅"
        if [[ "$status" != "success" ]]; then
            emoji="❌"
        fi
        
        local notification="${emoji} *Backup ${status}*\n\n"
        notification+="*Server:* $(hostname)\n"
        notification+="*Time:* $(date)\n"
        notification+="*Message:* ${message}\n"
        
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_ADMIN_CHAT_ID}" \
            -d text="${notification}" \
            -d parse_mode="Markdown" > /dev/null || true
    fi
}

# Main function
main() {
    local action=${1:-"daily"}
    
    init_backup_env
    
    case "$action" in
        "daily")
            log "INFO" "Starting daily backup routine..."
            success_count=0
            
            backup_configuration && ((success_count++))
            backup_sessions && ((success_count++))
            backup_logs && ((success_count++))
            backup_database_metadata && ((success_count++))
            
            if [[ $success_count -eq 4 ]]; then
                send_notification "success" "Daily backup completed successfully ($success_count/4 components)"
            else
                send_notification "partial" "Daily backup partially completed ($success_count/4 components)"
            fi
            ;;
        
        "weekly")
            log "INFO" "Starting weekly full backup..."
            if create_full_backup; then
                cleanup_old_backups
                send_notification "success" "Weekly full backup completed successfully"
            else
                send_notification "failure" "Weekly full backup failed"
            fi
            ;;
        
        "emergency")
            log "INFO" "Creating emergency backup..."
            local emergency_backup="${BACKUP_BASE_DIR}/emergency/emergency_backup_$(date '+%Y%m%d_%H%M%S').tar.gz.enc"
            if create_full_backup; then
                cp "$(find "${BACKUP_BASE_DIR}/weekly" -name "full_backup_*.tar.gz.enc" -type f -printf '%T@ %p\n' | sort -k1,1nr | head -1 | cut -d' ' -f2-)" "$emergency_backup"
                send_notification "success" "Emergency backup created successfully"
            else
                send_notification "failure" "Emergency backup failed"
            fi
            ;;
        
        "cleanup")
            cleanup_old_backups
            ;;
        
        "report")
            generate_backup_report
            ;;
        
        "restore")
            if [[ $# -lt 3 ]]; then
                echo "Usage: $0 restore <backup_file> <target_directory>"
                exit 1
            fi
            restore_backup "$2" "manual" "$3"
            ;;
        
        "verify")
            if [[ $# -lt 2 ]]; then
                echo "Usage: $0 verify <backup_file>"
                exit 1
            fi
            verify_backup "$2"
            ;;
        
        *)
            echo "Usage: $0 {daily|weekly|emergency|cleanup|report|restore|verify}"
            echo "  daily     - Create daily incremental backup"
            echo "  weekly    - Create weekly full backup"
            echo "  emergency - Create immediate emergency backup"
            echo "  cleanup   - Clean up old backup files"
            echo "  report    - Generate backup status report"
            echo "  restore   - Restore from backup file"
            echo "  verify    - Verify backup file integrity"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"