#!/bin/bash
set -e

# Telegram User Bot Setup Script for Ubuntu 22.04
# This script creates a production-ready Telegram userbot with proper virtual environment

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_PURPLE='\033[0;35m'
COLOR_CYAN='\033[0;36m'
COLOR_NC='\033[0m' # No Color

echo -e "${COLOR_PURPLE}🤖 TELEGRAM USER BOT SETUP - Ubuntu 22.04${COLOR_NC}"
echo "=================================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo -e "${COLOR_YELLOW}⚠️  Running as root. This is fine for system setup.${COLOR_NC}"
fi

# Function to print status
print_status() {
    echo -e "${COLOR_BLUE}📋 $1${COLOR_NC}"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${COLOR_NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${COLOR_NC}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠️  $1${COLOR_NC}"
}

# Function to check and fix apt_pkg issues without modifying system Python
fix_apt_pkg() {
    print_status "Checking apt_pkg integrity..."
    
    # Check if apt_pkg module exists and works
    if python3 -c "import apt_pkg" 2>/dev/null; then
        print_success "apt_pkg is working correctly"
        return 0
    fi
    
    print_warning "apt_pkg module has issues, attempting to fix..."
    
    # Try to reinstall python3-apt
    if command -v apt-get &> /dev/null; then
        print_status "Reinstalling python3-apt..."
        apt-get update -qq
        apt-get install --reinstall -y python3-apt
        
        # Test again
        if python3 -c "import apt_pkg" 2>/dev/null; then
            print_success "apt_pkg fixed successfully"
            return 0
        fi
    fi
    
    print_warning "apt_pkg still has issues, but continuing with setup..."
    return 0
}

# Function to install system packages
install_system_packages() {
    print_status "Installing system dependencies..."
    
    # Fix apt_pkg issues first
    fix_apt_pkg
    
    # Disable problematic command-not-found hook temporarily
    export APT_LISTCHANGES_FRONTEND=none
    export DEBIAN_FRONTEND=noninteractive
    
    # Update package lists (ignore command-not-found errors)
    apt-get update 2>/dev/null || {
        print_warning "apt update had some warnings, but continuing..."
    }
    
    # Install essential packages
    local packages=(
        # Core Python and build tools
        python3.11
        python3.11-venv
        python3.11-dev
        python3-pip
        build-essential
        
        # Multimedia support
        ffmpeg
        libopus0
        libopus-dev
        
        # Cryptography and security
        libffi-dev
        libsodium-dev
        libnacl-dev
        libssl-dev
        
        # Image processing
        libjpeg-dev
        zlib1g-dev
        libpng-dev
        
        # System utilities
        libmagic1
        curl
        wget
        git
        
        # For better package management
        software-properties-common
    )
    
    print_status "Installing packages: ${packages[*]}"
    
    for package in "${packages[@]}"; do
        if ! apt-get install -y "$package" 2>/dev/null; then
            print_warning "Failed to install $package, trying alternative..."
            # Fallback for python3.11 to python3.10
            if [[ "$package" == "python3.11"* ]]; then
                local alt_package=${package/python3.11/python3.10}
                apt-get install -y "$alt_package" 2>/dev/null || print_warning "Also failed to install $alt_package"
            fi
        fi
    done
    
    print_success "System packages installation completed"
}

# Function to detect best Python version
detect_python() {
    print_status "Detecting best Python version..."
    
    # Prefer Python 3.11, fallback to 3.10
    if command -v python3.11 &> /dev/null; then
        PYTHON_CMD="python3.11"
        print_success "Using Python 3.11"
    elif command -v python3.10 &> /dev/null; then
        PYTHON_CMD="python3.10"
        print_success "Using Python 3.10"
    elif command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        local version=$(python3 --version | cut -d' ' -f2)
        print_success "Using system Python: $version"
    else
        print_error "No suitable Python version found!"
        exit 1
    fi
}

# Function to setup virtual environment
setup_venv() {
    local project_root=$(pwd)
    local venv_path="$project_root/telegram_userbot/.venv"
    
    print_status "Setting up virtual environment at $venv_path..."
    
    # Create telegram_userbot directory if it doesn't exist
    mkdir -p "$project_root/telegram_userbot"
    
    # Remove existing venv if present
    if [[ -d "$venv_path" ]]; then
        print_status "Removing existing virtual environment..."
        rm -rf "$venv_path"
    fi
    
    # Create new virtual environment
    $PYTHON_CMD -m venv "$venv_path"
    
    # Activate virtual environment
    source "$venv_path/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip setuptools wheel
    
    # Install requirements if file exists
    local req_file="$project_root/telegram_userbot/requirements.txt"
    if [[ -f "$req_file" ]]; then
        print_status "Installing Python dependencies from requirements.txt..."
        pip install -r "$req_file"
    else
        print_warning "requirements.txt not found, installing basic dependencies..."
        pip install pyrogram==2.0.106 tgcrypto==1.2.5 python-dotenv==1.0.*
    fi
    
    print_success "Virtual environment setup completed"
}

# Function to create .env template
create_env_template() {
    local project_root=$(pwd)
    local env_file="$project_root/telegram_userbot/.env"
    
    if [[ ! -f "$env_file" ]]; then
        print_status "Creating .env template..."
        
        cat > "$env_file" << 'EOF'
# Telegram User Bot Configuration
# Ubuntu 22.04 Production Setup

# ==========================================
# TELEGRAM API CONFIGURATION (REQUIRED)
# ==========================================
# Get these from https://my.telegram.org/apps
API_ID=your_api_id_here
API_HASH=your_api_hash_here

# ==========================================
# SESSION CONFIGURATION (CHOOSE ONE)
# ==========================================
# Option 1: Use phone number (will create session file)
# PHONE_NUMBER=+1234567890

# Option 2: Use session string (recommended for production)
SESSION_STRING=your_session_string_here

# ==========================================
# SUPABASE CONFIGURATION (OPTIONAL)
# ==========================================
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# ==========================================
# BOT SETTINGS (OPTIONAL)
# ==========================================
LOG_LEVEL=INFO
EOF
        
        chmod 600 "$env_file"
        print_success "Created .env template at $env_file"
    else
        print_success ".env file already exists"
    fi
}

# Function to create runner script
create_runner_script() {
    local project_root=$(pwd)
    local runner_file="$project_root/telegram_userbot/run_userbot.sh"
    
    print_status "Creating runner script..."
    
    cat > "$runner_file" << EOF
#!/bin/bash
# Telegram User Bot Runner Script
# Production runner with proper environment isolation

set -e

# Get script directory
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="\$(dirname "\$SCRIPT_DIR")"
VENV_PATH="\$SCRIPT_DIR/.venv"

# Colors for output
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m'

echo -e "\${COLOR_GREEN}🚀 Starting Telegram User Bot...\${COLOR_NC}"

# Check if virtual environment exists
if [[ ! -d "\$VENV_PATH" ]]; then
    echo -e "\${COLOR_RED}❌ Virtual environment not found at \$VENV_PATH\${COLOR_NC}"
    echo -e "\${COLOR_YELLOW}Please run setup_telegram_userbot.sh first\${COLOR_NC}"
    exit 1
fi

# Check if .env exists
if [[ ! -f "\$SCRIPT_DIR/.env" ]]; then
    echo -e "\${COLOR_RED}❌ .env file not found\${COLOR_NC}"
    echo -e "\${COLOR_YELLOW}Please configure \$SCRIPT_DIR/.env first\${COLOR_NC}"
    exit 1
fi

# Activate virtual environment
source "\$VENV_PATH/bin/activate"

# Change to script directory
cd "\$SCRIPT_DIR"

# Export Python path
export PYTHONPATH="\$SCRIPT_DIR:\$PYTHONPATH"

# Run the bot
echo -e "\${COLOR_GREEN}📱 Activating userbot...\${COLOR_NC}"

# Handle graceful shutdown
cleanup() {
    echo -e "\${COLOR_YELLOW}🛑 Shutting down gracefully...\${COLOR_NC}"
    kill -TERM \$BOT_PID 2>/dev/null || true
    wait \$BOT_PID 2>/dev/null || true
    echo -e "\${COLOR_GREEN}✅ Bot stopped\${COLOR_NC}"
}

trap cleanup SIGTERM SIGINT

# Start the bot in background and wait
python main.py &
BOT_PID=\$!

# Wait for the bot process
wait \$BOT_PID
EOF
    
    chmod +x "$runner_file"
    print_success "Created runner script at $runner_file"
}

# Function to create systemd service
create_systemd_service() {
    local project_root=$(pwd)
    local service_file="/etc/systemd/system/telegram-userbot.service"
    
    print_status "Creating systemd service..."
    
    cat > "$service_file" << EOF
[Unit]
Description=Telegram User Bot - Production Service
After=network.target network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=\$(whoami)
Group=\$(whoami)
WorkingDirectory=$project_root/telegram_userbot
ExecStart=$project_root/telegram_userbot/run_userbot.sh
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStartSec=60
TimeoutStopSec=30

# Environment isolation
Environment=PATH=$project_root/telegram_userbot/.venv/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=-$project_root/telegram_userbot/.env

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$project_root/telegram_userbot
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=telegram-userbot

[Install]
WantedBy=multi-user.target
EOF
    
    # Fix user/group in service file
    sed -i "s/\$(whoami)/$(whoami)/g" "$service_file"
    
    # Reload systemd
    systemctl daemon-reload
    
    print_success "Created systemd service at $service_file"
}

# Main execution
main() {
    print_status "Starting Telegram User Bot setup for Ubuntu 22.04..."
    
    # Check if we're in the right directory
    if [[ ! -d "telegram_userbot" ]] && [[ ! -f "telegram_userbot/main.py" ]]; then
        print_warning "telegram_userbot directory not found, creating it..."
        mkdir -p telegram_userbot
    fi
    
    # Install system packages
    install_system_packages
    
    # Detect Python version
    detect_python
    
    # Setup virtual environment
    setup_venv
    
    # Create configuration files
    create_env_template
    create_runner_script
    
    # Create systemd service
    create_systemd_service
    
    print_success "Setup completed successfully!"
    echo ""
    echo -e "${COLOR_CYAN}📋 NEXT STEPS:${COLOR_NC}"
    echo -e "${COLOR_YELLOW}1.${COLOR_NC} Configure your bot:"
    echo -e "   ${COLOR_BLUE}nano telegram_userbot/.env${COLOR_NC}"
    echo ""
    echo -e "${COLOR_YELLOW}2.${COLOR_NC} Test the bot:"
    echo -e "   ${COLOR_BLUE}./telegram_userbot/run_userbot.sh${COLOR_NC}"
    echo ""
    echo -e "${COLOR_YELLOW}3.${COLOR_NC} Enable systemd service (optional):"
    echo -e "   ${COLOR_BLUE}sudo systemctl enable telegram-userbot${COLOR_NC}"
    echo -e "   ${COLOR_BLUE}sudo systemctl start telegram-userbot${COLOR_NC}"
    echo ""
    echo -e "${COLOR_YELLOW}4.${COLOR_NC} Monitor logs:"
    echo -e "   ${COLOR_BLUE}journalctl -u telegram-userbot -f${COLOR_NC}"
    echo ""
    echo -e "${COLOR_GREEN}🎉 Your Telegram User Bot is ready!${COLOR_NC}"
}

# Run main function
main "$@"