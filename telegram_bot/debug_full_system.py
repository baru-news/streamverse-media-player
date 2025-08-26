#!/usr/bin/env python3
"""
Full system diagnostic for Telegram Bot
Tests all components and dependencies
"""

import asyncio
import logging
import os
import sys
import traceback
from pathlib import Path
import json

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check essential environment variables"""
    logger.info("=== CHECKING ENVIRONMENT VARIABLES ===")
    
    required_vars = [
        'TELEGRAM_API_ID',
        'TELEGRAM_API_HASH', 
        'TELEGRAM_PHONE_NUMBER',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DOODSTREAM_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if 'KEY' in var or 'HASH' in var or 'PHONE' in var:
                display_value = f"{value[:5]}...{value[-3:]}" if len(value) > 8 else "***"
            else:
                display_value = value
            logger.info(f"✅ {var}: {display_value}")
        else:
            missing_vars.append(var)
            logger.error(f"❌ {var}: NOT SET")
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        return False
    
    logger.info("✅ All required environment variables are set")
    return True

def test_imports():
    """Test all necessary imports"""
    logger.info("=== TESTING IMPORTS ===")
    
    # Test Pyrogram
    try:
        import pyrogram
        from pyrogram import Client
        logger.info(f"✅ Pyrogram: v{pyrogram.__version__}")
    except ImportError as e:
        logger.error(f"❌ Pyrogram import failed: {e}")
        return False
    
    # Test asyncio and uvloop
    try:
        import uvloop
        logger.info("✅ uvloop available")
    except ImportError:
        logger.warning("⚠️ uvloop not available (optional)")
    
    # Test local modules
    try:
        from config import Config
        logger.info("✅ Config module imported")
        
        config = Config()
        logger.info("✅ Config instance created")
    except Exception as e:
        logger.error(f"❌ Config import/creation failed: {e}")
        return False
    
    try:
        from supabase_client import SupabaseManager
        logger.info("✅ SupabaseManager imported")
        
        supabase = SupabaseManager()
        logger.info("✅ SupabaseManager instance created")
    except Exception as e:
        logger.error(f"❌ SupabaseManager import/creation failed: {e}")
        return False
    
    # Test handlers
    try:
        from handlers.auth_handler import AuthHandler
        from handlers.file_handler import FileHandler
        from handlers.admin_handler import AdminHandler
        logger.info("✅ All handlers imported")
    except Exception as e:
        logger.error(f"❌ Handlers import failed: {e}")
        return False
    
    # Test utils
    try:
        from utils.logger_setup import setup_logging
        from utils.progress_tracker import ProgressTracker
        logger.info("✅ Utils imported")
    except Exception as e:
        logger.error(f"❌ Utils import failed: {e}")
        return False
    
    return True

async def test_pyrogram_client():
    """Test Pyrogram client creation"""
    logger.info("=== TESTING PYROGRAM CLIENT ===")
    
    try:
        from config import Config
        config = Config()
        
        # Create client with proxy settings if available
        client_kwargs = {
            "api_id": config.API_ID,
            "api_hash": config.API_HASH,
            "phone_number": config.PHONE_NUMBER,
            "workdir": config.SESSION_DIR
        }
        
        # Check for proxy settings
        proxy_host = os.getenv('PROXY_HOST')
        proxy_port = os.getenv('PROXY_PORT')
        proxy_user = os.getenv('PROXY_USERNAME')
        proxy_pass = os.getenv('PROXY_PASSWORD')
        
        if proxy_host and proxy_port:
            logger.info(f"Using proxy: {proxy_host}:{proxy_port}")
            proxy_dict = {
                "scheme": "socks5",
                "hostname": proxy_host,
                "port": int(proxy_port)
            }
            if proxy_user and proxy_pass:
                proxy_dict["username"] = proxy_user
                proxy_dict["password"] = proxy_pass
            
            client_kwargs["proxy"] = proxy_dict
        
        from pyrogram import Client
        
        client = Client("test_bot", **client_kwargs)
        logger.info("✅ Pyrogram Client created successfully")
        
        # Try to connect (this might fail if not authenticated)
        try:
            await client.connect()
            logger.info("✅ Pyrogram Client connected successfully")
            
            # Get self info if connected
            me = await client.get_me()
            logger.info(f"✅ Bot info: {me.first_name} (@{me.username}) - ID: {me.id}")
            
            await client.disconnect()
        except Exception as e:
            logger.warning(f"⚠️ Client connection test failed (may need authentication): {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Pyrogram client test failed: {e}")
        logger.error(traceback.format_exc())
        return False

async def test_supabase_connection():
    """Test Supabase connection"""
    logger.info("=== TESTING SUPABASE CONNECTION ===")
    
    try:
        from supabase_client import SupabaseManager
        
        supabase = SupabaseManager()
        
        # Test basic connection with a simple query
        result = await supabase.call_edge_function('telegram-webhook', {'test': True})
        if result:
            logger.info("✅ Supabase connection working")
        else:
            logger.warning("⚠️ Supabase connection test returned None")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Supabase connection test failed: {e}")
        return False

def check_file_structure():
    """Check if all required files exist"""
    logger.info("=== CHECKING FILE STRUCTURE ===")
    
    required_files = [
        "main.py",
        "config.py", 
        "supabase_client.py",
        "handlers/__init__.py",
        "handlers/auth_handler.py",
        "handlers/file_handler.py",
        "handlers/admin_handler.py",
        "utils/__init__.py",
        "utils/logger_setup.py",
        "utils/progress_tracker.py"
    ]
    
    missing_files = []
    for file_path in required_files:
        if Path(file_path).exists():
            logger.info(f"✅ {file_path}")
        else:
            missing_files.append(file_path)
            logger.error(f"❌ {file_path} - MISSING")
    
    if missing_files:
        logger.error(f"Missing files: {missing_files}")
        return False
    
    logger.info("✅ All required files exist")
    return True

def check_directories():
    """Check if required directories exist"""
    logger.info("=== CHECKING DIRECTORIES ===")
    
    required_dirs = [
        "/opt/telegram-bot/sessions",
        "/opt/telegram-bot/downloads", 
        "/opt/telegram-bot/logs"
    ]
    
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists():
            logger.info(f"✅ {dir_path}")
        else:
            logger.warning(f"⚠️ {dir_path} - Creating...")
            try:
                path.mkdir(parents=True, exist_ok=True, mode=0o755)
                logger.info(f"✅ Created {dir_path}")
            except Exception as e:
                logger.error(f"❌ Failed to create {dir_path}: {e}")
                return False
    
    return True

def create_startup_script():
    """Create a startup script for the bot"""
    logger.info("=== CREATING STARTUP SCRIPT ===")
    
    script_content = """#!/bin/bash

# Telegram Bot Startup Script
echo "Starting Telegram Bot..."

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found. Please run from bot directory."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Check Python version
python_version=$(python3 --version 2>&1)
echo "Python version: $python_version"

# Check if all required packages are installed
echo "Checking dependencies..."
python3 -c "import pyrogram; print(f'Pyrogram: {pyrogram.__version__}')" 2>/dev/null || echo "WARNING: Pyrogram not found"

# Set environment if .env exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | xargs)
fi

# Run the diagnostic first
echo "Running system diagnostic..."
python3 debug_full_system.py

# If diagnostic passes, start the bot
if [ $? -eq 0 ]; then
    echo "Diagnostic passed. Starting bot..."
    python3 main.py
else
    echo "Diagnostic failed. Please fix issues before starting bot."
    exit 1
fi
"""
    
    try:
        with open("start_bot.sh", "w") as f:
            f.write(script_content)
        
        # Make executable
        os.chmod("start_bot.sh", 0o755)
        logger.info("✅ Created start_bot.sh")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create startup script: {e}")
        return False

async def main():
    """Run all diagnostic tests"""
    logger.info("🤖 TELEGRAM BOT FULL SYSTEM DIAGNOSTIC")
    logger.info("=" * 50)
    
    all_tests = [
        ("Environment Variables", check_environment),
        ("File Structure", check_file_structure),
        ("Directories", check_directories),
        ("Python Imports", test_imports),
        ("Pyrogram Client", test_pyrogram_client),
        ("Supabase Connection", test_supabase_connection),
        ("Startup Script", create_startup_script)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in all_tests:
        logger.info(f"\n--- {test_name} ---")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            
            if result:
                passed += 1
                logger.info(f"✅ {test_name} PASSED")
            else:
                failed += 1
                logger.error(f"❌ {test_name} FAILED")
                
        except Exception as e:
            failed += 1
            logger.error(f"❌ {test_name} ERROR: {e}")
    
    logger.info("\n" + "=" * 50)
    logger.info(f"DIAGNOSTIC COMPLETE: {passed} PASSED, {failed} FAILED")
    
    if failed == 0:
        logger.info("🎉 All tests passed! Bot should work correctly.")
        logger.info("Run: ./start_bot.sh to start the bot")
        return True
    else:
        logger.error("🔧 Some tests failed. Please fix the issues above.")
        return False

if __name__ == "__main__":
    # Ensure we're in the correct directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    try:
        result = asyncio.run(main())
        sys.exit(0 if result else 1)
    except KeyboardInterrupt:
        logger.info("Diagnostic interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Diagnostic crashed: {e}")
        logger.error(traceback.format_exc())
        sys.exit(1)