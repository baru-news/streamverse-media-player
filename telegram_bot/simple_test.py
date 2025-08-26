#!/usr/bin/env python3
"""
Simple test to verify SupabaseManager works
"""

import sys
import os
sys.path.insert(0, '/opt/telegram-bot/telegram_bot')

def test_basic_import():
    print("=== BASIC SUPABASE TEST ===")
    
    try:
        print("1. Testing Config import...")
        from config import Config
        config = Config()
        print("✅ Config OK")
        
        print("2. Testing SupabaseManager import...")
        from supabase_client import SupabaseManager
        print("✅ Import OK")
        
        print("3. Creating SupabaseManager instance...")
        supabase = SupabaseManager()
        print("✅ Instance creation OK")
        
        print("4. Testing basic properties...")
        print(f"   Base URL: {supabase.base_url}")
        print("✅ Properties OK")
        
        print("🎉 ALL TESTS PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_basic_import()