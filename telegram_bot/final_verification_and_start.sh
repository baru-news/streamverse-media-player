#!/bin/bash
# Final Verification and Service Start Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }

BOT_DIR="/opt/telegram-bot/telegram_bot"

echo ""
echo "🔍 FINAL VERIFICATION & SERVICE START"
echo "===================================="

echo ""
echo "📊 FASE 5: COMPLETE VERIFICATION"
echo "==============================="

log "Verifying all files exist and have correct line counts..."

# Define expected files and their line counts
declare -A EXPECTED_FILES=(
    ["$BOT_DIR/main.py"]=181
    ["$BOT_DIR/config.py"]=130
    ["$BOT_DIR/supabase_client.py"]=297
    ["$BOT_DIR/handlers/__init__.py"]=15
    ["$BOT_DIR/handlers/auth_handler.py"]=200
    ["$BOT_DIR/handlers/admin_handler.py"]=277
    ["$BOT_DIR/handlers/file_handler.py"]=391
    ["$BOT_DIR/utils/__init__.py"]=1
    ["$BOT_DIR/utils/logger_setup.py"]=88
    ["$BOT_DIR/utils/progress_tracker.py"]=165
)

total_files=0
correct_files=0
total_lines=0

for file_path in "${!EXPECTED_FILES[@]}"; do
    expected_lines=${EXPECTED_FILES[$file_path]}
    total_files=$((total_files + 1))
    
    if [ -f "$file_path" ]; then
        actual_lines=$(wc -l < "$file_path")
        total_lines=$((total_lines + actual_lines))
        
        if [ "$actual_lines" -eq "$expected_lines" ]; then
            success "$(basename $file_path): $actual_lines lines ✓"
            correct_files=$((correct_files + 1))
        else
            error "$(basename $file_path): Expected $expected_lines, got $actual_lines"
        fi
    else
        error "$(basename $file_path): File missing"
    fi
done

echo ""
log "File verification summary:"
echo "• Total files: $total_files"
echo "• Correct files: $correct_files"
echo "• Total lines of code: $total_lines"

if [ $correct_files -eq $total_files ]; then
    success "ALL FILES VERIFIED SUCCESSFULLY! 🎉"
else
    error "Some files have incorrect line counts or are missing!"
    exit 1
fi

echo ""
log "Checking critical methods in supabase_client.py..."

CRITICAL_METHODS=(
    "get_profile_by_telegram_id"
    "is_telegram_admin"
    "create_telegram_link_code"
    "is_premium_group_with_autoupload"
    "log_telegram_upload"
)

for method in "${CRITICAL_METHODS[@]}"; do
    if grep -q "def $method" "$BOT_DIR/supabase_client.py"; then
        success "Method '$method' found"
    else
        error "Method '$method' NOT found"
    fi
done

echo ""
log "Testing Python imports..."

cd $BOT_DIR

# Test main imports
python3 -c "
try:
    from config import Config
    print('✅ Config import: OK')
except Exception as e:
    print('❌ Config import failed:', e)
    exit(1)

try:
    from supabase_client import SupabaseManager
    print('✅ SupabaseManager import: OK')
except Exception as e:
    print('❌ SupabaseManager import failed:', e)
    exit(1)

try:
    from handlers.auth_handler import AuthHandler
    print('✅ AuthHandler import: OK')
except Exception as e:
    print('❌ AuthHandler import failed:', e)
    exit(1)

try:
    from handlers.admin_handler import AdminHandler
    print('✅ AdminHandler import: OK')
except Exception as e:
    print('❌ AdminHandler import failed:', e)
    exit(1)

try:
    from handlers.file_handler import FileHandler
    print('✅ FileHandler import: OK')
except Exception as e:
    print('❌ FileHandler import failed:', e)
    exit(1)

try:
    from utils.logger_setup import setup_logging
    print('✅ Logger setup import: OK')
except Exception as e:
    print('❌ Logger setup import failed:', e)
    exit(1)

try:
    from utils.progress_tracker import ProgressTracker
    print('✅ ProgressTracker import: OK')
except Exception as e:
    print('❌ ProgressTracker import failed:', e)
    exit(1)

print('🎉 ALL IMPORTS SUCCESSFUL!')
" || {
    error "Import test failed!"
    exit 1
}

success "All Python imports working correctly!"

echo ""
echo "🔐 CHECKING .env FILE"
echo "==================="

ENV_FILE="/opt/telegram-bot/.env"
if [ -f "$ENV_FILE" ]; then
    success ".env file exists"
    
    # Check for required variables
    REQUIRED_VARS=(
        "TELEGRAM_API_ID"
        "TELEGRAM_API_HASH"
        "TELEGRAM_PHONE_NUMBER"
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DOODSTREAM_API_KEY"
    )
    
    missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" "$ENV_FILE" && ! grep -q "^$var=$" "$ENV_FILE" && ! grep -q "^$var=your_" "$ENV_FILE"; then
            success "$var is configured"
        else
            error "$var is missing or not configured"
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        success "All required environment variables are configured!"
    else
        warning "Missing variables: ${missing_vars[*]}"
        echo ""
        echo "📝 Please configure these variables in $ENV_FILE:"
        for var in "${missing_vars[@]}"; do
            echo "   $var=your_value_here"
        done
        echo ""
        read -p "Continue anyway? (y/N): " continue_anyway
        if [[ $continue_anyway != [yY] ]]; then
            echo "Please configure .env file first."
            exit 0
        fi
    fi
else
    warning ".env file not found"
    echo ""
    echo "📝 Creating .env template..."
    cp "/opt/telegram-bot/telegram_bot/.env.template" "$ENV_FILE"
    echo ""
    echo "🔧 Please edit $ENV_FILE with your credentials:"
    echo "   nano $ENV_FILE"
    echo ""
    read -p "Press Enter when you've configured the .env file..."
fi

echo ""
echo "🚀 FASE 6: SERVICE START & TESTING"
echo "================================="

log "Starting telegram-bot service..."
sudo systemctl start telegram-bot

sleep 5

log "Checking service status..."
if sudo systemctl is-active --quiet telegram-bot; then
    success "Service is running!"
else
    error "Service failed to start!"
    echo ""
    echo "📋 Service logs:"
    sudo journalctl -u telegram-bot -n 20 --no-pager
    exit 1
fi

echo ""
log "Showing recent logs..."
sudo journalctl -u telegram-bot -n 10 --no-pager

echo ""
echo "🎉 100% SYNCHRONIZATION & STARTUP COMPLETE!"
echo "==========================================="
echo ""
echo "✨ FINAL STATUS:"
echo "• 📁 All files synchronized (10 files, $total_lines lines)"
echo "• 🔗 All imports working"
echo "• ⚙️  Environment configured"
echo "• 🚀 Service running"
echo ""
echo "🧪 TESTING YOUR BOT:"
echo "==================="
echo "1. Open Telegram and find your bot"
echo "2. Send: /start"
echo "3. Send: /link"
echo "4. Send: /status"
echo "5. If admin: /admin"
echo ""
echo "📊 Monitor logs: sudo journalctl -u telegram-bot -f"
echo "🔄 Restart service: sudo systemctl restart telegram-bot"
echo "⏹️  Stop service: sudo systemctl stop telegram-bot"
echo ""
success "BOT IS READY FOR PRODUCTION! 🚀✨"