#!/bin/bash
# Fix Supabase dependency conflicts after httpx upgrade

echo "🔄 Upgrading Supabase packages to fix httpx compatibility..."

# Activate virtual environment
source /opt/telegram-bot/venv/bin/activate

# Upgrade all Supabase-related packages to latest versions
echo "📦 Upgrading Supabase packages..."
pip install --upgrade supabase
pip install --upgrade gotrue
pip install --upgrade postgrest
pip install --upgrade storage3
pip install --upgrade supafunc

# Clean up any broken distributions
echo "🧹 Cleaning up broken distributions..."
pip install --force-reinstall httpx==0.28.1

echo "✅ Dependencies fixed!"
echo ""
echo "Next steps:"
echo "1. Run: python test_supabase.py"
echo "2. If still issues, run: pip list | grep -E '(supabase|httpx|gotrue)'"