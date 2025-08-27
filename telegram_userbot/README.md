# Telegram User Bot - Production Setup

A production-ready Telegram User Bot optimized for Ubuntu 22.04 with proper virtual environment isolation, JSON logging, and systemd integration.

## 🚀 Quick Start

### Prerequisites

- Ubuntu 22.04 LTS
- Python 3.10+ (Python 3.11 preferred)
- Root/sudo access for initial setup
- Telegram API credentials
- Optional: Supabase account for database features

### 1. Setup

Run the automated setup script:

```bash
sudo ./setup_telegram_userbot.sh
```

This will:
- Install system dependencies (ffmpeg, build tools, etc.)
- Create a Python virtual environment in `telegram_userbot/.venv`
- Install all Python dependencies
- Create configuration templates
- Setup systemd service
- Create runner scripts

### 2. Configuration

Edit the configuration file:

```bash
nano telegram_userbot/.env
```

**Required Settings:**
```env
# Get from https://my.telegram.org/apps
API_ID=your_api_id_here
API_HASH=your_api_hash_here

# Choose ONE authentication method:
SESSION_STRING=your_session_string_here
# OR
# PHONE_NUMBER=+1234567890
```

**Optional Settings:**
```env
# For database features
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Logging
LOG_LEVEL=INFO
```

### 3. Getting SESSION_STRING

#### Method 1: Generate using Python script

Create a temporary script to generate your session string:

```python
# generate_session.py
from pyrogram import Client

api_id = 12345678  # Your API ID
api_hash = "your_api_hash"  # Your API Hash

with Client("my_session", api_id, api_hash) as app:
    print(f"SESSION_STRING={app.export_session_string()}")
```

Run it once:
```bash
cd telegram_userbot
source .venv/bin/activate
python generate_session.py
```

#### Method 2: Use online generators (less secure)

Visit: https://replit.com/@SpEcHiDe/GenerateStringSession

**⚠️ Security Note:** Session strings provide full access to your Telegram account. Keep them secure!

### 4. Running the Bot

#### Manual Run (for testing):
```bash
./telegram_userbot/run_userbot.sh
```

#### Production (systemd service):
```bash
# Enable service
sudo systemctl enable telegram-userbot

# Start service
sudo systemctl start telegram-userbot

# Check status
sudo systemctl status telegram-userbot
```

### 5. Monitoring

#### View logs:
```bash
# Real-time logs
journalctl -u telegram-userbot -f

# Recent logs
journalctl -u telegram-userbot -n 50

# Logs with JSON parsing
journalctl -u telegram-userbot -f | jq '.'
```

#### Service management:
```bash
# Restart service
sudo systemctl restart telegram-userbot

# Stop service
sudo systemctl stop telegram-userbot

# Disable service
sudo systemctl disable telegram-userbot
```

## 📱 Bot Commands

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/ping` | Test bot responsiveness | `/ping` |
| `/save <text>` | Save text to database (requires Supabase) | `/save Hello World` |
| `/help` | Show help message | `/help` |

### Usage Examples

1. **Test connectivity:**
   ```
   /ping
   ```
   Response: `🏓 pong`

2. **Save data to database:**
   ```
   /save This is a test message
   ```
   Response: `✅ Saved: This is a test message`

## 🗄️ Database Setup (Optional)

If you want to use the `/save` command, you need to create a Supabase table:

```sql
-- Create messages table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy (adjust as needed)
CREATE POLICY "Allow all operations" ON messages
FOR ALL USING (true);
```

## 🔧 Architecture

### File Structure
```
telegram_userbot/
├── .venv/                 # Virtual environment (auto-created)
├── .sessions/             # Pyrogram session files (auto-created)
├── main.py               # Main bot application
├── requirements.txt      # Python dependencies
├── .env                  # Configuration (create from template)
├── run_userbot.sh       # Runner script
└── README.md            # This file

systemd/
└── telegram-userbot.service  # Systemd service template
```

### Key Features

- **Virtual Environment Isolation**: All dependencies in local `.venv`
- **JSON Structured Logging**: Machine-readable logs with optional loguru
- **Graceful Shutdown**: Proper SIGTERM/SIGINT handling
- **Production Ready**: Systemd integration with auto-restart
- **Security**: Restrictive systemd security settings
- **Performance**: uvloop for better async performance
- **Flexibility**: Optional Supabase integration

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pyrogram | 2.0.106 | Telegram MTProto client |
| tgcrypto | 1.2.5 | Cryptography for pyrogram |
| python-dotenv | 1.0.* | Environment variable loading |
| python-json-logger | 2.0.* | JSON structured logging |
| uvloop | 0.19.* | High-performance event loop |
| supabase | 2.5.* | Database client (optional) |
| loguru | 0.7.* | Enhanced logging (optional) |

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Virtual environment not found"
```bash
# Re-run setup
sudo ./setup_telegram_userbot.sh
```

#### 2. "API_ID and API_HASH are required"
- Edit `telegram_userbot/.env`
- Add your Telegram API credentials

#### 3. "Failed to start bot: Session not found"
- Generate and add SESSION_STRING to `.env`
- OR add PHONE_NUMBER and run once manually

#### 4. Service fails to start
```bash
# Check service status
sudo systemctl status telegram-userbot

# Check logs
journalctl -u telegram-userbot -n 50
```

#### 5. Permission issues
```bash
# Fix ownership
sudo chown -R $(whoami):$(whoami) telegram_userbot/

# Fix permissions
chmod +x telegram_userbot/run_userbot.sh
```

### Log Analysis

#### Successful startup logs should show:
```json
{
  "asctime": "2024-01-01 12:00:00,000",
  "name": "__main__",
  "levelname": "INFO",
  "message": "✅ User Bot started successfully!"
}
```

#### Error patterns to look for:
- `API_ID and API_HASH are required` → Configuration issue
- `Session not found` → Authentication issue
- `Connection failed` → Network issue
- `Import error` → Dependency issue

### Performance Tuning

#### For high-traffic bots:
1. Increase resource limits in systemd service
2. Enable uvloop (automatically done)
3. Adjust log levels to WARNING or ERROR
4. Monitor memory usage with `systemctl status telegram-userbot`

## 🔐 Security Considerations

### Session Security
- Keep SESSION_STRING secret
- Don't commit `.env` to version control
- Use separate sessions for different environments

### System Security
- The systemd service runs with restrictive permissions
- ProtectSystem=strict prevents system modification
- PrivateTmp isolates temporary files
- NoNewPrivileges prevents privilege escalation

### Network Security
- Bot only connects to Telegram and configured Supabase
- No external network access required

## 📊 Monitoring

### Health Checks
The bot responds to `/ping` for health monitoring:
```bash
# Simple health check
echo "/ping" | telegram-cli -W
```

### Metrics
- Service uptime: `systemctl status telegram-userbot`
- Memory usage: `journalctl -u telegram-userbot | grep -i memory`
- Message processing: Check application logs

### Alerting
Set up systemd service alerts:
```bash
# Create override directory
sudo systemctl edit telegram-userbot

# Add failure notifications (example)
[Service]
OnFailure=notify-failure@%n.service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test on Ubuntu 22.04
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check logs: `journalctl -u telegram-userbot -f`
- Verify configuration: `cat telegram_userbot/.env`
- Test manually: `./telegram_userbot/run_userbot.sh`
- Check service: `sudo systemctl status telegram-userbot`

For issues, create a GitHub issue with:
- Ubuntu version: `lsb_release -a`
- Python version: `python3 --version`
- Service logs: `journalctl -u telegram-userbot -n 100`
- Configuration (without secrets): `cat telegram_userbot/.env | grep -v "API\|SESSION\|KEY"`