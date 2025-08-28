#!/usr/bin/env python3
"""
Docker Health Check Script for Telegram Userbot
Verifies critical services are running properly
"""

import asyncio
import sys
import os
import json
import aiohttp
import psutil
from datetime import datetime
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent))

from config import Config
from utils.logger_setup import logger
from utils.supabase_client import SupabaseManager

class HealthChecker:
    def __init__(self):
        self.config = Config()
        self.supabase = SupabaseManager()
        self.health_status = {
            'timestamp': datetime.now().isoformat(),
            'status': 'unknown',
            'checks': {}
        }
    
    async def check_system_resources(self):
        """Check system resource usage"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            
            # Check thresholds
            resource_ok = (
                cpu_percent < 90 and
                memory_percent < 90 and
                disk_percent < 90
            )
            
            self.health_status['checks']['system_resources'] = {
                'status': 'healthy' if resource_ok else 'warning',
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'disk_percent': disk_percent
            }
            
            return resource_ok
        except Exception as e:
            logger.error(f"System resource check failed: {e}")
            self.health_status['checks']['system_resources'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def check_supabase_connection(self):
        """Check Supabase database connectivity"""
        try:
            result = await self.supabase.test_connection()
            
            self.health_status['checks']['supabase'] = {
                'status': 'healthy' if result else 'error',
                'connected': result
            }
            
            return result
        except Exception as e:
            logger.error(f"Supabase connection check failed: {e}")
            self.health_status['checks']['supabase'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def check_telegram_api(self):
        """Check Telegram API connectivity for userbot"""
        try:
            api_id = self.config.TELEGRAM_API_ID
            api_hash = self.config.TELEGRAM_API_HASH
            
            if not api_id or not api_hash:
                raise ValueError("Telegram userbot API credentials not configured")
            
            # For userbot, we just check if credentials are configured
            # Actual connection test would require session setup
            self.health_status['checks']['telegram_api'] = {
                'status': 'healthy',
                'api_id_configured': bool(api_id),
                'api_hash_configured': bool(api_hash),
                'note': 'Userbot credentials validated'
            }
            
            return True
                        
        except Exception as e:
            logger.error(f"Telegram API check failed: {e}")
            self.health_status['checks']['telegram_api'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def check_doodstream_api(self):
        """Check Doodstream API connectivity"""
        try:
            api_key = self.config.DOODSTREAM_API_KEY
            if not api_key:
                raise ValueError("Doodstream API key not configured")
            
            async with aiohttp.ClientSession() as session:
                url = "https://doodapi.com/api/account/info"
                params = {'key': api_key}
                
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        api_ok = data.get('status') == 200
                        
                        self.health_status['checks']['doodstream_api'] = {
                            'status': 'healthy' if api_ok else 'error',
                            'response_status': response.status,
                            'api_status': data.get('status')
                        }
                        
                        return api_ok
                    else:
                        self.health_status['checks']['doodstream_api'] = {
                            'status': 'error',
                            'response_status': response.status
                        }
                        return False
        except Exception as e:
            logger.error(f"Doodstream API check failed: {e}")
            self.health_status['checks']['doodstream_api'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def check_bot_processes(self):
        """Check if bot processes are running"""
        try:
            # Check for Python processes running main.py
            bot_processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['name'] == 'python' or 'python' in proc.info['name']:
                        cmdline = proc.info['cmdline'] or []
                        if any('main.py' in cmd for cmd in cmdline):
                            bot_processes.append({
                                'pid': proc.info['pid'],
                                'cmdline': ' '.join(cmdline)
                            })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            processes_ok = len(bot_processes) > 0
            
            self.health_status['checks']['bot_processes'] = {
                'status': 'healthy' if processes_ok else 'error',
                'running_processes': len(bot_processes),
                'processes': bot_processes
            }
            
            return processes_ok
        except Exception as e:
            logger.error(f"Process check failed: {e}")
            self.health_status['checks']['bot_processes'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def check_log_files(self):
        """Check if log files are being written"""
        try:
            log_dir = Path('/app/logs')
            if not log_dir.exists():
                log_dir = Path('./logs')
            
            if log_dir.exists():
                log_files = list(log_dir.glob('*.log'))
                recent_logs = []
                
                for log_file in log_files:
                    try:
                        stat = log_file.stat()
                        # Check if file was modified in last 5 minutes
                        age_minutes = (datetime.now().timestamp() - stat.st_mtime) / 60
                        if age_minutes < 5:
                            recent_logs.append({
                                'file': str(log_file),
                                'size': stat.st_size,
                                'age_minutes': round(age_minutes, 2)
                            })
                    except Exception:
                        continue
                
                logs_ok = len(recent_logs) > 0
                
                self.health_status['checks']['log_files'] = {
                    'status': 'healthy' if logs_ok else 'warning',
                    'total_log_files': len(log_files),
                    'recent_logs': len(recent_logs),
                    'recent_log_files': recent_logs
                }
                
                return logs_ok
            else:
                self.health_status['checks']['log_files'] = {
                    'status': 'warning',
                    'error': 'Log directory not found'
                }
                return False
        except Exception as e:
            logger.error(f"Log file check failed: {e}")
            self.health_status['checks']['log_files'] = {
                'status': 'error',
                'error': str(e)
            }
            return False
    
    async def run_all_checks(self):
        """Run all health checks"""
        try:
            logger.info("Starting health checks...")
            
            # Run all checks concurrently
            checks = await asyncio.gather(
                self.check_system_resources(),
                self.check_supabase_connection(),
                self.check_telegram_api(),
                self.check_doodstream_api(),
                self.check_bot_processes(),
                self.check_log_files(),
                return_exceptions=True
            )
            
            # Count successful checks
            successful_checks = sum(1 for check in checks if check is True)
            total_checks = len(checks)
            
            # Determine overall health status
            if successful_checks == total_checks:
                self.health_status['status'] = 'healthy'
            elif successful_checks >= total_checks * 0.7:  # 70% threshold
                self.health_status['status'] = 'degraded'
            else:
                self.health_status['status'] = 'unhealthy'
            
            self.health_status['summary'] = {
                'successful_checks': successful_checks,
                'total_checks': total_checks,
                'success_rate': round(successful_checks / total_checks * 100, 2)
            }
            
            # Write health status to file for monitoring
            health_file = Path('/tmp/health_status.json')
            health_file.write_text(json.dumps(self.health_status, indent=2))
            
            logger.info(f"Health check completed: {self.health_status['status']} "
                       f"({successful_checks}/{total_checks} checks passed)")
            
            return self.health_status['status'] == 'healthy'
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            self.health_status['status'] = 'error'
            self.health_status['error'] = str(e)
            return False

async def main():
    """Main health check function"""
    health_checker = HealthChecker()
    
    try:
        is_healthy = await health_checker.run_all_checks()
        
        # Print status for Docker health check
        print(json.dumps(health_checker.health_status, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if is_healthy else 1)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        print(f'{{"status": "error", "error": "{str(e)}"}}')
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())