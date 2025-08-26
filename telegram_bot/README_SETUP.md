# Telegram Bot Setup Guide

## Masalah yang Ditemukan dan Solusi

Setelah audit lengkap, saya menemukan beberapa masalah yang menyebabkan bot tidak merespon:

### 1. **File dan Dependencies Tidak Lengkap**
- Beberapa file Python mungkin tidak ter-sync dengan benar
- Dependencies mungkin tidak ter-install dengan benar

### 2. **Environment Variables Tidak Lengkap** 
- Bot membutuhkan TELEGRAM_BOT_TOKEN yang mungkin belum di-set
- Konfigurasi Supabase mungkin tidak lengkap

### 3. **Setup Sistem Tidak Optimal**
- Bot perlu running sebagai service
- Logging dan monitoring tidak ter-setup

## 📋 Langkah Setup Lengkap

### Step 1: Jalankan Setup Otomatis
```bash
# Buat setup script executable
chmod +x setup_complete_bot.sh

# Jalankan setup (butuh sudo)
sudo ./setup_complete_bot.sh
```

### Step 2: Konfigurasi Environment
```bash
# Edit file konfigurasi
sudo nano /opt/telegram-bot/.env

# Isi dengan credentials yang benar:
# - TELEGRAM_API_ID (dari my.telegram.org)  
# - TELEGRAM_API_HASH (dari my.telegram.org)
# - TELEGRAM_PHONE_NUMBER (nomor bot)
# - TELEGRAM_BOT_TOKEN (dari @BotFather)
# - SUPABASE_SERVICE_ROLE_KEY
# - DOODSTREAM_API_KEY
```

### Step 3: Test System 
```bash
cd /opt/telegram-bot
./bot-diagnostic.sh
```

### Step 4: Start Bot
```bash
# Start as service
sudo systemctl start telegram-bot

# Check status
./bot-status.sh

# Monitor logs live
./bot-logs.sh
```

## 🛠️ Management Commands

Setelah setup, gunakan commands ini:

```bash
# Status bot
./bot-status.sh

# Start/Stop/Restart
./bot-start.sh
./bot-stop.sh  
./bot-restart.sh

# Monitor logs
./bot-logs.sh

# Test system
./bot-diagnostic.sh
```

## 🔧 Troubleshooting Manual

Jika masih ada masalah, jalankan diagnostic lengkap:

```bash
cd /opt/telegram-bot
python3 debug_full_system.py
```

### Masalah Umum:

1. **ImportError**: Install dependencies
```bash
cd /opt/telegram-bot
source venv/bin/activate
pip install pyrogram tgcrypto requests
```

2. **Permission Error**: Fix ownership
```bash
sudo chown -R $USER:$USER /opt/telegram-bot
sudo chmod -R 755 /opt/telegram-bot
```

3. **Environment Error**: Check .env file
```bash
cat /opt/telegram-bot/.env
# Pastikan semua variable terisi dengan benar
```

4. **Network Error**: Test connection
```bash
curl -s https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

## 📁 File Structure

```
/opt/telegram-bot/
├── main.py                 # Bot utama  
├── config.py              # Konfigurasi
├── supabase_client.py     # Supabase client
├── debug_full_system.py   # Diagnostic
├── .env                   # Environment variables
├── venv/                  # Virtual environment
├── handlers/              # Message handlers
│   ├── __init__.py
│   ├── auth_handler.py
│   ├── file_handler.py
│   └── admin_handler.py
├── utils/                 # Utilities
│   ├── __init__.py
│   ├── logger_setup.py
│   └── progress_tracker.py
└── bot-*.sh              # Management scripts
```

## 🚀 Next Steps

1. **Setup webhook Telegram** (opsional - bot bisa polling)
2. **Monitor logs** untuk memastikan bot berjalan  
3. **Test commands**: `/start`, `/link`, `/help`
4. **Setup backup** dan monitoring

## ⚠️ PENTING

- **Jangan share** file .env (berisi credentials)
- **Backup** file konfigurasi sebelum update
- **Monitor logs** secara berkala  
- **Test bot** setelah setiap perubahan

---

Jika masih ada masalah setelah setup ini, berikan output dari:
```bash
./bot-diagnostic.sh
journalctl -u telegram-bot -n 50
```