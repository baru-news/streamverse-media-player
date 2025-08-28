#!/bin/bash
set -euo pipefail

# Production Deployment Script for Telegram Bot (Docker-based)
# Implements zero-downtime deployment with health checks and rollback capability

# Configuration
PROJECT_NAME="telegram-userbot"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="/opt/backups/deployments"
DEPLOY_LOG="/var/log/telegram-bot/deployment.log"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ENABLED=true
MAINTENANCE_MODE=false
DOCKER_COMPOSE_FILE="docker-compose.production.yml"

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

# Check if running as correct user (not root)
check_user() {
    if [[ $EUID -eq 0 ]]; then
        log "ERROR" "This script should not be run as root"
        exit 1
    fi
    
    # Check if user has docker access
    if ! docker ps >/dev/null 2>&1; then
        log "ERROR" "Current user does not have Docker access. Add user to docker group or run with appropriate permissions."
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "INFO" "Setting up deployment directories..."
    
    sudo mkdir -p "${BACKUP_DIR}"
    sudo mkdir -p "$(dirname "${DEPLOY_LOG}")"
    sudo chown $USER:$USER "${BACKUP_DIR}" "$(dirname "${DEPLOY_LOG}")"
    
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/config"
    mkdir -p "${PROJECT_ROOT}/nginx/ssl"
}

# Validate environment
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check if environment file exists
    if [[ ! -f "${PROJECT_ROOT}/.env.production" ]]; then
        log "ERROR" "Production environment file not found: ${PROJECT_ROOT}/.env.production"
        log "INFO" "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi
    
    # Source environment file
    set -o allexport
    source "${PROJECT_ROOT}/.env.production"
    set +o allexport
    
    # Check required environment variables
    local required_vars=(
        "TELEGRAM_API_ID"
        "TELEGRAM_API_HASH"
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
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log "ERROR" "Docker Compose is not installed"
        exit 1
    fi
    
    log "INFO" "Environment validation passed"
}

# Pre-deployment health check
pre_deployment_health_check() {
    log "INFO" "Running pre-deployment health check..."
    
    # Check if containers are running
    if docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps | grep -q "Up"; then
        log "INFO" "Some containers are currently running"
        
        # Check bot health
        if docker exec telegram-userbot-prod python health_check.py >/dev/null 2>&1; then
            log "INFO" "Current bot is responding to health checks"
        else
            log "WARN" "Current bot is not responding to health checks"
        fi
    else
        log "INFO" "No containers currently running"
    fi
    
    # Test external connectivity
    test_external_connectivity
}

# Test external connectivity
test_external_connectivity() {
    log "INFO" "Testing external service connectivity..."
    
    # Test Supabase
    local supabase_test=$(curl -s --max-time 10 "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_ANON_KEY}" -o /dev/null -w "%{http_code}")
    if [[ "$supabase_test" != "200" ]]; then
        log "ERROR" "Supabase connectivity test failed (HTTP ${supabase_test})"
        exit 1
    fi
    
    # Test Doodstream
    local dood_test=$(curl -s --max-time 10 "https://doodapi.com/api/account/info?key=${DOODSTREAM_API_KEY}" | jq -r '.status // 0')
    if [[ "$dood_test" != "200" ]]; then
        log "ERROR" "Doodstream API connectivity test failed"
        exit 1
    fi
    
    log "INFO" "External connectivity tests passed"
}

# Create deployment backup
create_backup() {
    log "INFO" "Creating deployment backup..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="${PROJECT_NAME}_backup_${backup_timestamp}"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    mkdir -p "${backup_path}"
    
    # Backup configuration and data
    if [[ -d "${PROJECT_ROOT}/config" ]]; then
        cp -r "${PROJECT_ROOT}/config" "${backup_path}/"
        log "INFO" "Configuration backup created"
    fi
    
    if [[ -d "${PROJECT_ROOT}/logs" ]]; then
        # Backup only recent logs (last 100MB per file)
        find "${PROJECT_ROOT}/logs" -name "*.log" -exec sh -c 'tail -c 100M "$1" > "'${backup_path}'/$(basename "$1")"' _ {} \;
        log "INFO" "Logs backup created"
    fi
    
    # Save current container state
    docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps --format "table {{.Name}}\t{{.Image}}\t{{.Status}}" > "${backup_path}/containers_before.txt" 2>/dev/null || true
    
    # Save current images
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" > "${backup_path}/images_before.txt"
    
    # Store backup info
    echo "${backup_name}" > "${BACKUP_DIR}/latest_backup"
    echo "${backup_path}" > "${PROJECT_ROOT}/.last_backup_path"
    log "INFO" "Backup completed: ${backup_name}"
}

# Setup SSL certificates
setup_ssl() {
    log "INFO" "Setting up SSL certificates..."
    
    local ssl_dir="${PROJECT_ROOT}/nginx/ssl"
    
    if [[ ! -f "${ssl_dir}/cert.pem" || ! -f "${ssl_dir}/key.pem" ]]; then
        log "WARN" "SSL certificates not found, generating self-signed certificates..."
        
        # Generate self-signed certificate
        openssl req -x509 -newkey rsa:4096 -nodes \
            -out "${ssl_dir}/cert.pem" \
            -keyout "${ssl_dir}/key.pem" \
            -days 365 \
            -subj "/C=US/ST=State/L=City/O=TelegramBot/CN=localhost"
        
        chmod 644 "${ssl_dir}/cert.pem"
        chmod 600 "${ssl_dir}/key.pem"
        
        log "WARN" "Self-signed certificates generated. Replace with proper SSL certificates for production."
    else
        log "INFO" "SSL certificates found"
    fi
}

# Deploy new version
deploy_new_version() {
    log "INFO" "Deploying new version with Docker Compose..."
    
    cd "${PROJECT_ROOT}"
    
    # Pull latest base images
    log "INFO" "Pulling base Docker images..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" pull --ignore-pull-failures || log "WARN" "Some base images could not be pulled"
    
    # Build application images
    log "INFO" "Building application images..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" build --parallel --no-cache
    
    log "INFO" "Docker images built successfully"
}

# Start services
start_services() {
    log "INFO" "Starting services with Docker Compose..."
    
    cd "${PROJECT_ROOT}"
    
    # Start services in dependency order
    log "INFO" "Starting infrastructure services first..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d nginx
    
    sleep 5
    
    log "INFO" "Starting monitoring services..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d monitoring security-monitor backup
    
    sleep 10
    
    log "INFO" "Starting main bot service..."
    docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d telegram-bot
    
    log "INFO" "All services started"
}

# Post-deployment health check
post_deployment_health_check() {
    log "INFO" "Running post-deployment health check..."
    
    local check_count=0
    local max_checks=$((HEALTH_CHECK_TIMEOUT / 10))
    
    while [[ $check_count -lt $max_checks ]]; do
        local all_healthy=true
        
        # Check if all containers are running
        local running_containers=$(docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps --filter "status=running" --format "table {{.Name}}" | tail -n +2 | wc -l)
        local total_containers=$(docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" config --services | wc -l)
        
        if [[ $running_containers -eq $total_containers ]]; then
            log "INFO" "All containers are running (${running_containers}/${total_containers})"
            
            # Check container health status
            local unhealthy=$(docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps --filter "health=unhealthy" --format "table {{.Name}}" | tail -n +2)
            
            if [[ -z "$unhealthy" ]]; then
                # Test bot health specifically
                if docker exec telegram-userbot-prod python health_check.py >/dev/null 2>&1; then
                    log "INFO" "Post-deployment health check passed"
                    return 0
                else
                    log "WARN" "Bot health check failed, attempt $((check_count + 1))/${max_checks}"
                    all_healthy=false
                fi
            else
                log "WARN" "Unhealthy containers detected: ${unhealthy}"
                all_healthy=false
            fi
        else
            log "WARN" "Not all containers running (${running_containers}/${total_containers}), attempt $((check_count + 1))/${max_checks}"
            all_healthy=false
        fi
        
        if [[ "$all_healthy" == "false" ]]; then
            ((check_count++))
            sleep 10
        fi
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
    
    # Stop all services
    docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" down
    
    # Get backup info
    if [[ -f "${PROJECT_ROOT}/.last_backup_path" ]]; then
        local backup_path=$(cat "${PROJECT_ROOT}/.last_backup_path")
        
        # Restore configuration
        if [[ -d "${backup_path}/config" ]]; then
            rm -rf "${PROJECT_ROOT}/config"
            cp -r "${backup_path}/config" "${PROJECT_ROOT}/"
            log "INFO" "Configuration restored from backup"
        fi
        
        # Try to start services with previous configuration
        log "INFO" "Attempting to restart with previous configuration..."
        docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" up -d
        
        # Give it time to start
        sleep 30
        
        if post_deployment_health_check; then
            log "INFO" "Rollback completed successfully"
            return 0
        else
            log "ERROR" "Rollback health check failed"
            return 1
        fi
    else
        log "ERROR" "No backup path found for rollback"
        return 1
    fi
}

# Cleanup old resources
cleanup_old_resources() {
    log "INFO" "Cleaning up old Docker resources..."
    
    # Remove unused Docker images (keep current ones)
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    # Cleanup old backups (keep last 10)
    cd "${BACKUP_DIR}"
    ls -t | grep "${PROJECT_NAME}_backup_" | tail -n +11 | xargs -r rm -rf
    
    log "INFO" "Cleanup completed"
}

# Display post-deployment information
post_deployment_info() {
    log "INFO" "Deployment completed successfully!"
    
    echo ""
    echo -e "${BLUE}Container Status:${NC}"
    docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps
    
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo "  Main Dashboard (Grafana): https://your-domain:3000"
    echo "  Monitoring (Prometheus): https://your-domain:9090"
    echo "  Bot Health Check: https://your-domain/health"
    echo ""
    
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  View logs: docker-compose -f ${DOCKER_COMPOSE_FILE} logs -f [service]"
    echo "  Check status: docker-compose -f ${DOCKER_COMPOSE_FILE} ps"
    echo "  Restart service: docker-compose -f ${DOCKER_COMPOSE_FILE} restart [service]"
    echo ""
    
    echo -e "${YELLOW}Important Notes:${NC}"
    echo "  - Update DNS to point to this server"
    echo "  - Replace self-signed SSL certificates with proper ones"
    echo "  - Configure monitoring alerts"
    echo "  - Verify all bot functionality is working"
}

# Main deployment function
main() {
    log "INFO" "Starting production deployment..."
    
    # Setup
    setup_directories
    check_user
    validate_environment
    pre_deployment_health_check
    create_backup
    setup_ssl
    
    # Deploy
    deploy_new_version
    start_services
    
    # Verify
    if post_deployment_health_check; then
        cleanup_old_resources
        post_deployment_info
        log "INFO" "Production deployment completed successfully!"
    else
        log "ERROR" "Deployment failed health checks"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            if rollback_deployment; then
                log "INFO" "Rollback completed"
            else
                log "ERROR" "Rollback also failed - manual intervention required"
            fi
        fi
        exit 1
    fi
}

# Script entry point
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health")
        post_deployment_health_check
        ;;
    "logs")
        docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" ps
        ;;
    "stop")
        docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" down
        ;;
    "start")
        docker-compose -f "${PROJECT_ROOT}/${DOCKER_COMPOSE_FILE}" up -d
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|logs [service]|status|stop|start}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full production deployment (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Run health check on current deployment"
        echo "  logs     - View logs (optionally for specific service)"
        echo "  status   - Show container status"
        echo "  stop     - Stop all services"
        echo "  start    - Start all services"
        exit 1
        ;;
esac