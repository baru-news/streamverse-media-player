#!/usr/bin/env python3
"""
Advanced Backup Service for Telegram Bot
Handles automated scheduled backups with cloud integration and disaster recovery.
"""

import asyncio
import os
import json
import subprocess
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
import aiofiles
import aioboto3
import schedule
import time

@dataclass
class BackupJob:
    job_id: str
    backup_type: str  # daily, weekly, monthly, emergency
    schedule_pattern: str
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    status: str  # pending, running, completed, failed
    file_path: Optional[str]
    cloud_path: Optional[str]
    size_bytes: int
    duration_seconds: float

class BackupService:
    def __init__(self, supabase_client, config_path: str = "config/backup_config.json"):
        self.supabase = supabase_client
        self.config_path = config_path
        self.backup_jobs = {}
        self.is_running = False
        self.current_job = None
        
        # Configuration
        self.config = {
            'backup_base_dir': '/opt/telegram-userbot/backups',
            'retention_days': 30,
            'max_backup_size_gb': 10,
            's3_bucket': os.getenv('AWS_S3_BUCKET', 'telegram-bot-backups'),
            'encryption_enabled': True,
            'compression_level': 9,
            'schedules': {
                'daily': '0 2 * * *',      # Daily at 2 AM
                'weekly': '0 3 * * 0',     # Weekly on Sunday at 3 AM
                'monthly': '0 4 1 * *'     # Monthly on 1st at 4 AM
            },
            'notification_webhook': os.getenv('BACKUP_WEBHOOK_URL'),
            'admin_chat_id': os.getenv('TELEGRAM_ADMIN_CHAT_ID')
        }
        
        self.logger = logging.getLogger('backup_service')
        self._setup_logging()
        self._load_config()

    def _setup_logging(self):
        """Setup backup service logging"""
        os.makedirs('logs/backup', exist_ok=True)
        
        backup_handler = logging.FileHandler('logs/backup/backup_service.log')
        backup_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
        self.logger.addHandler(backup_handler)
        self.logger.setLevel(logging.INFO)

    def _load_config(self):
        """Load backup configuration from file"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    file_config = json.load(f)
                    self.config.update(file_config)
        except Exception as e:
            self.logger.warning(f"Failed to load backup config: {e}")

    async def _save_config(self):
        """Save current configuration to file"""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            async with aiofiles.open(self.config_path, 'w') as f:
                await f.write(json.dumps(self.config, indent=2, default=str))
        except Exception as e:
            self.logger.error(f"Failed to save backup config: {e}")

    async def create_backup(self, backup_type: str = "manual") -> BackupJob:
        """Create a new backup with specified type"""
        job_id = f"{backup_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        backup_job = BackupJob(
            job_id=job_id,
            backup_type=backup_type,
            schedule_pattern="",
            last_run=datetime.utcnow(),
            next_run=None,
            status="running",
            file_path=None,
            cloud_path=None,
            size_bytes=0,
            duration_seconds=0
        )
        
        self.backup_jobs[job_id] = backup_job
        self.current_job = backup_job
        
        start_time = time.time()
        
        try:
            self.logger.info(f"Starting {backup_type} backup: {job_id}")
            
            # Execute backup script
            backup_script = "/opt/telegram-userbot/scripts/backup_manager.sh"
            
            if backup_type in ["daily", "weekly", "emergency"]:
                result = await self._run_backup_script(backup_script, backup_type)
            else:
                result = await self._run_backup_script(backup_script, "daily")
            
            backup_job.duration_seconds = time.time() - start_time
            
            if result['success']:
                backup_job.status = "completed"
                backup_job.file_path = result.get('backup_file')
                backup_job.size_bytes = result.get('file_size', 0)
                
                # Upload to cloud if configured
                if self._is_cloud_backup_enabled():
                    cloud_result = await self._upload_to_cloud(backup_job)
                    if cloud_result['success']:
                        backup_job.cloud_path = cloud_result['cloud_path']
                
                self.logger.info(f"Backup completed successfully: {job_id}")
                await self._notify_backup_completion(backup_job, True)
            else:
                backup_job.status = "failed"
                self.logger.error(f"Backup failed: {job_id} - {result.get('error')}")
                await self._notify_backup_completion(backup_job, False, result.get('error'))
            
            # Store backup metadata in database
            await self._store_backup_metadata(backup_job)
            
        except Exception as e:
            backup_job.status = "failed"
            backup_job.duration_seconds = time.time() - start_time
            self.logger.error(f"Backup exception: {job_id} - {str(e)}")
            await self._notify_backup_completion(backup_job, False, str(e))
            await self._store_backup_metadata(backup_job)
        
        finally:
            self.current_job = None
        
        return backup_job

    async def _run_backup_script(self, script_path: str, backup_type: str) -> Dict:
        """Execute backup script and return results"""
        try:
            # Prepare environment variables
            env = os.environ.copy()
            env.update({
                'BACKUP_TYPE': backup_type,
                'BACKUP_BASE_DIR': self.config['backup_base_dir'],
                'RETENTION_DAYS': str(self.config['retention_days'])
            })
            
            # Execute backup script
            process = await asyncio.create_subprocess_exec(
                script_path, backup_type,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Parse output to get backup file info
                output = stdout.decode()
                backup_file = self._extract_backup_file_from_output(output)
                file_size = 0
                
                if backup_file and os.path.exists(backup_file):
                    file_size = os.path.getsize(backup_file)
                
                return {
                    'success': True,
                    'backup_file': backup_file,
                    'file_size': file_size,
                    'output': output
                }
            else:
                return {
                    'success': False,
                    'error': stderr.decode(),
                    'output': stdout.decode()
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _extract_backup_file_from_output(self, output: str) -> Optional[str]:
        """Extract backup file path from script output"""
        # Look for patterns like "Archive created successfully: /path/to/backup.tar.gz.enc"
        for line in output.split('\n'):
            if 'Archive created successfully:' in line:
                parts = line.split(': ')
                if len(parts) > 1:
                    file_path = parts[1].strip()
                    if '(' in file_path:  # Remove size info
                        file_path = file_path.split('(')[0].strip()
                    return file_path
        return None

    def _is_cloud_backup_enabled(self) -> bool:
        """Check if cloud backup is configured"""
        return (
            'AWS_ACCESS_KEY_ID' in os.environ and
            'AWS_SECRET_ACCESS_KEY' in os.environ and
            bool(self.config.get('s3_bucket'))
        )

    async def _upload_to_cloud(self, backup_job: BackupJob) -> Dict:
        """Upload backup to cloud storage"""
        try:
            if not backup_job.file_path or not os.path.exists(backup_job.file_path):
                return {'success': False, 'error': 'Backup file not found'}
            
            session = aioboto3.Session()
            
            async with session.client('s3') as s3_client:
                # Prepare S3 key
                filename = os.path.basename(backup_job.file_path)
                s3_key = f"{backup_job.backup_type}/{datetime.utcnow().strftime('%Y/%m')}/{filename}"
                
                # Upload file
                await s3_client.upload_file(
                    backup_job.file_path,
                    self.config['s3_bucket'],
                    s3_key,
                    ExtraArgs={
                        'StorageClass': 'STANDARD_IA',
                        'ServerSideEncryption': 'AES256'
                    }
                )
                
                cloud_path = f"s3://{self.config['s3_bucket']}/{s3_key}"
                self.logger.info(f"Backup uploaded to cloud: {cloud_path}")
                
                return {
                    'success': True,
                    'cloud_path': cloud_path,
                    's3_bucket': self.config['s3_bucket'],
                    's3_key': s3_key
                }
                
        except Exception as e:
            self.logger.error(f"Cloud upload failed: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def _store_backup_metadata(self, backup_job: BackupJob):
        """Store backup metadata in database"""
        try:
            backup_data = {
                'job_id': backup_job.job_id,
                'backup_type': backup_job.backup_type,
                'status': backup_job.status,
                'file_path': backup_job.file_path,
                'cloud_path': backup_job.cloud_path,
                'size_bytes': backup_job.size_bytes,
                'duration_seconds': backup_job.duration_seconds,
                'created_at': backup_job.last_run.isoformat() if backup_job.last_run else None
            }
            
            await self.supabase.table('performance_metrics').insert({
                'metric_type': 'backup_job',
                'metric_data': backup_data
            }).execute()
            
        except Exception as e:
            self.logger.error(f"Failed to store backup metadata: {e}")

    async def _notify_backup_completion(self, backup_job: BackupJob, success: bool, error_message: str = None):
        """Send backup completion notification"""
        try:
            status_emoji = "✅" if success else "❌"
            status_text = "completed successfully" if success else "failed"
            
            message = f"{status_emoji} *Backup {status_text}*\n\n"
            message += f"*Job ID:* {backup_job.job_id}\n"
            message += f"*Type:* {backup_job.backup_type}\n"
            message += f"*Duration:* {backup_job.duration_seconds:.1f}s\n"
            
            if success:
                if backup_job.size_bytes > 0:
                    size_mb = backup_job.size_bytes / (1024 * 1024)
                    message += f"*Size:* {size_mb:.1f} MB\n"
                
                if backup_job.cloud_path:
                    message += f"*Cloud:* Uploaded ✅\n"
            else:
                if error_message:
                    message += f"*Error:* {error_message[:100]}\n"
            
            message += f"*Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
            
            # Send Telegram notification
            if self.config.get('admin_chat_id'):
                await self._send_telegram_notification(message)
            
            # Send webhook notification
            if self.config.get('notification_webhook'):
                await self._send_webhook_notification(backup_job, success, error_message)
                
        except Exception as e:
            self.logger.error(f"Failed to send backup notification: {e}")

    async def _send_telegram_notification(self, message: str):
        """Send Telegram notification"""
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            chat_id = self.config.get('admin_chat_id')
            
            if bot_token and chat_id:
                import aiohttp
                
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                payload = {
                    'chat_id': chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload) as response:
                        if response.status == 200:
                            self.logger.info("Telegram notification sent successfully")
                        else:
                            self.logger.error(f"Telegram notification failed: {response.status}")
        except Exception as e:
            self.logger.error(f"Telegram notification error: {e}")

    async def _send_webhook_notification(self, backup_job: BackupJob, success: bool, error_message: str = None):
        """Send webhook notification"""
        try:
            webhook_url = self.config.get('notification_webhook')
            if not webhook_url:
                return
            
            payload = {
                'timestamp': datetime.utcnow().isoformat(),
                'job_id': backup_job.job_id,
                'backup_type': backup_job.backup_type,
                'status': backup_job.status,
                'success': success,
                'duration_seconds': backup_job.duration_seconds,
                'size_bytes': backup_job.size_bytes,
                'file_path': backup_job.file_path,
                'cloud_path': backup_job.cloud_path,
                'error_message': error_message
            }
            
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status == 200:
                        self.logger.info("Webhook notification sent successfully")
                    else:
                        self.logger.error(f"Webhook notification failed: {response.status}")
        except Exception as e:
            self.logger.error(f"Webhook notification error: {e}")

    async def restore_from_backup(self, backup_job_id: str, target_directory: str) -> Dict:
        """Restore system from a specific backup"""
        try:
            backup_job = self.backup_jobs.get(backup_job_id)
            if not backup_job:
                # Try to find backup metadata in database
                result = await self.supabase.table('performance_metrics')\
                    .select('*')\
                    .eq('metric_type', 'backup_job')\
                    .contains('metric_data', {'job_id': backup_job_id})\
                    .execute()
                
                if not result.data:
                    return {'success': False, 'error': 'Backup job not found'}
                
                backup_data = result.data[0]['metric_data']
                backup_file = backup_data.get('file_path')
            else:
                backup_file = backup_job.file_path
            
            if not backup_file or not os.path.exists(backup_file):
                return {'success': False, 'error': 'Backup file not found'}
            
            # Execute restore script
            restore_script = "/opt/telegram-userbot/scripts/backup_manager.sh"
            
            process = await asyncio.create_subprocess_exec(
                restore_script, "restore", backup_file, target_directory,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                self.logger.info(f"Restoration completed successfully: {backup_job_id}")
                return {
                    'success': True,
                    'message': 'Restoration completed successfully',
                    'output': stdout.decode()
                }
            else:
                self.logger.error(f"Restoration failed: {backup_job_id}")
                return {
                    'success': False,
                    'error': stderr.decode(),
                    'output': stdout.decode()
                }
                
        except Exception as e:
            self.logger.error(f"Restore exception: {str(e)}")
            return {'success': False, 'error': str(e)}

    def schedule_backups(self):
        """Schedule automatic backups"""
        self.logger.info("Setting up backup schedules...")
        
        # Clear existing schedules
        schedule.clear()
        
        # Schedule daily backups
        schedule.every().day.at("02:00").do(
            lambda: asyncio.create_task(self.create_backup("daily"))
        )
        
        # Schedule weekly backups
        schedule.every().sunday.at("03:00").do(
            lambda: asyncio.create_task(self.create_backup("weekly"))
        )
        
        # Schedule monthly backups
        schedule.every().month.do(
            lambda: asyncio.create_task(self.create_backup("monthly"))
        )
        
        self.logger.info("Backup schedules configured")

    async def get_backup_history(self, days: int = 30) -> List[Dict]:
        """Get backup history from database"""
        try:
            since_date = datetime.utcnow() - timedelta(days=days)
            
            result = await self.supabase.table('performance_metrics')\
                .select('*')\
                .eq('metric_type', 'backup_job')\
                .gte('created_at', since_date.isoformat())\
                .order('created_at', desc=True)\
                .execute()
            
            return [record['metric_data'] for record in result.data] if result.data else []
        except Exception as e:
            self.logger.error(f"Failed to get backup history: {e}")
            return []

    async def cleanup_old_backups(self):
        """Clean up old backup files and records"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=self.config['retention_days'])
            
            # Get old backup records
            result = await self.supabase.table('performance_metrics')\
                .select('*')\
                .eq('metric_type', 'backup_job')\
                .lt('created_at', cutoff_date.isoformat())\
                .execute()
            
            cleanup_count = 0
            
            if result.data:
                for record in result.data:
                    backup_data = record['metric_data']
                    
                    # Remove local file if exists
                    file_path = backup_data.get('file_path')
                    if file_path and os.path.exists(file_path):
                        os.remove(file_path)
                        cleanup_count += 1
                    
                    # Remove cloud file if configured
                    cloud_path = backup_data.get('cloud_path')
                    if cloud_path and self._is_cloud_backup_enabled():
                        await self._delete_cloud_backup(cloud_path)
                
                # Remove database records
                await self.supabase.table('performance_metrics')\
                    .delete()\
                    .eq('metric_type', 'backup_job')\
                    .lt('created_at', cutoff_date.isoformat())\
                    .execute()
            
            self.logger.info(f"Cleanup completed: removed {cleanup_count} old backups")
            
        except Exception as e:
            self.logger.error(f"Cleanup failed: {e}")

    async def _delete_cloud_backup(self, cloud_path: str):
        """Delete backup from cloud storage"""
        try:
            if cloud_path.startswith('s3://'):
                # Parse S3 path
                parts = cloud_path.replace('s3://', '').split('/', 1)
                bucket = parts[0]
                key = parts[1]
                
                session = aioboto3.Session()
                
                async with session.client('s3') as s3_client:
                    await s3_client.delete_object(Bucket=bucket, Key=key)
                    self.logger.info(f"Deleted cloud backup: {cloud_path}")
                    
        except Exception as e:
            self.logger.error(f"Failed to delete cloud backup {cloud_path}: {e}")

    async def start_service(self):
        """Start the backup service"""
        self.is_running = True
        self.logger.info("Backup service starting...")
        
        # Schedule backups
        self.schedule_backups()
        
        # Main service loop
        while self.is_running:
            try:
                # Run pending scheduled jobs
                schedule.run_pending()
                
                # Cleanup old backups once per day
                if datetime.utcnow().hour == 1 and datetime.utcnow().minute < 5:
                    await self.cleanup_old_backups()
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                self.logger.error(f"Backup service error: {e}")
                await asyncio.sleep(60)

    def stop_service(self):
        """Stop the backup service"""
        self.is_running = False
        self.logger.info("Backup service stopped")

    async def get_service_status(self) -> Dict:
        """Get current service status"""
        recent_jobs = await self.get_backup_history(7)
        
        return {
            'service_running': self.is_running,
            'current_job': self.current_job.job_id if self.current_job else None,
            'recent_jobs_count': len(recent_jobs),
            'last_successful_backup': self._get_last_successful_backup(recent_jobs),
            'next_scheduled_backup': self._get_next_scheduled_backup(),
            'cloud_backup_enabled': self._is_cloud_backup_enabled(),
            'retention_days': self.config['retention_days']
        }

    def _get_last_successful_backup(self, recent_jobs: List[Dict]) -> Optional[str]:
        """Get timestamp of last successful backup"""
        for job in recent_jobs:
            if job.get('status') == 'completed':
                return job.get('created_at')
        return None

    def _get_next_scheduled_backup(self) -> Optional[str]:
        """Get next scheduled backup time"""
        try:
            next_job = schedule.next_run()
            return next_job.isoformat() if next_job else None
        except:
            return None