#!/bin/bash
# Telegram User Bot Runner Script
# Production runner with proper environment isolation

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PATH="$SCRIPT_DIR/.venv"

# Colors for output
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m'

echo -e "${COLOR_GREEN}🚀 Starting Telegram User Bot...${COLOR_NC}"

# Check if virtual environment exists
if [[ ! -d "$VENV_PATH" ]]; then
    echo -e "${COLOR_RED}❌ Virtual environment not found at $VENV_PATH${COLOR_NC}"
    echo -e "${COLOR_YELLOW}Please run setup_telegram_userbot.sh first${COLOR_NC}"
    exit 1
fi

# Check if .env exists
if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    echo -e "${COLOR_RED}❌ .env file not found${COLOR_NC}"
    echo -e "${COLOR_YELLOW}Please configure $SCRIPT_DIR/.env first${COLOR_NC}"
    exit 1
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Change to script directory
cd "$SCRIPT_DIR"

# Export Python path
export PYTHONPATH="$SCRIPT_DIR:$PYTHONPATH"

# Run the bot
echo -e "${COLOR_GREEN}📱 Activating userbot...${COLOR_NC}"

# Handle graceful shutdown
cleanup() {
    echo -e "${COLOR_YELLOW}🛑 Shutting down gracefully...${COLOR_NC}"
    kill -TERM $BOT_PID 2>/dev/null || true
    wait $BOT_PID 2>/dev/null || true
    echo -e "${COLOR_GREEN}✅ Bot stopped${COLOR_NC}"
}

trap cleanup SIGTERM SIGINT

# Start the bot in background and wait
python main.py &
BOT_PID=$!

# Wait for the bot process
wait $BOT_PID