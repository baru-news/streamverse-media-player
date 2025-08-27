#!/bin/bash
# Telegram User Bot Runner Script
# Production runner with proper environment isolation

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PATH="$SCRIPT_DIR/.venv"

# Colors
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m'

echo -e "${COLOR_GREEN}🚀 Starting Telegram User Bot...${COLOR_NC}"
cd "$SCRIPT_DIR"

# Activate venv
if [[ ! -d "$VENV_PATH" ]]; then
  echo -e "${COLOR_YELLOW}Creating venv...${COLOR_NC}"
  python3 -m venv "$VENV_PATH"
fi
source "$VENV_PATH/bin/activate"

# Install deps if needed (idempotent)
if ! python -c "import pyrogram, dotenv, httpx" >/dev/null 2>&1; then
  echo -e "${COLOR_YELLOW}Installing dependencies...${COLOR_NC}"
  if [[ -f "$SCRIPT_DIR/requirements.txt" ]]; then
    pip install -U pip
    pip install -r "$SCRIPT_DIR/requirements.txt"
  else
    pip install -U pip
    pip install pyrogram "python-dotenv" httpx python-json-logger
  fi
fi

# Load .env to get dirs (if exist)
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(SESSION_DIR|DOWNLOAD_DIR)=' "$SCRIPT_DIR/.env" | sed 's/\r$//' | xargs -d '\n' -I {} echo {})
fi

# Defaults
: "${SESSION_DIR:=$SCRIPT_DIR/.sessions}"
: "${DOWNLOAD_DIR:=$SCRIPT_DIR/downloads}"

mkdir -p "$SESSION_DIR" "$DOWNLOAD_DIR"

echo -e "${COLOR_GREEN}📱 Activating userbot...${COLOR_NC}"

cleanup() {
  echo -e "${COLOR_YELLOW}🛑 Shutting down gracefully...${COLOR_NC}"
  kill -TERM $BOT_PID 2>/dev/null || true
  wait $BOT_PID 2>/dev/null || true
  echo -e "${COLOR_GREEN}✅ Bot stopped${COLOR_NC}"
}

trap cleanup SIGTERM SIGINT

# Start the bot in foreground (so we can trap it)
python main.py &
BOT_PID=$!

wait $BOT_PID