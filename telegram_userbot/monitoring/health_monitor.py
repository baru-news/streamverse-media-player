#!/usr/bin/env python3
"""
Advanced Health Monitoring System for Production Telegram Bot
Monitors system resources, bot responsiveness, API connectivity, and sends alerts.
"""

import asyncio
import psutil
import aiohttp
import logging
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

@dataclass
class HealthMetric:
    timestamp: datetime
    metric_name: str
    value: float
    unit: str
    status: str  # healthy, warning, critical
    threshold_warning: float
    threshold_critical: float

@dataclass
class SystemHealth:
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    bot_responsiveness: bool
    database_connectivity: bool
    doodstream_api_status: bool
    telegram_api_status: bool
    active_uploads: int
    queue_size: int
    error_rate: float

class HealthMonitor:
    def __init__(self, supabase_client, telegram_bot=None, config_path: str = "config/health_monitor.json"):
        self.supabase = supabase_client
        self.telegram_bot = telegram_bot
        self.config_path = config_path
        self.health_history = []
        self.alert_cooldowns = {}
        self.monitoring_active = False
        
        # Health thresholds
        self.thresholds = {
            'cpu_warning': 70.0,
            'cpu_critical': 90.0,
            'memory_warning': 80.0,
            'memory_critical': 95.0,
            'disk_warning': 85.0,
            'disk_critical': 95.0,
            'error_rate_warning': 5.0,
            'error_rate_critical': 15.0,
            'response_time_warning': 5000,  # milliseconds
            'response_time_critical': 10000
        }
        
        # Alert settings
        self.alert_channels = {
            'telegram_admin_chat': None,
            'email_recipients': [],
            'webhook_url': None
        }
        
        self.logger = logging.getLogger('health_monitor')
        self._setup_logging()
        self._load_config()

    def _setup_logging(self):
        """Setup health monitoring logging"""
        os.makedirs('logs/health', exist_ok=True)
        
        health_handler = logging.FileHandler('logs/health/health_monitor.log')
        health_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        )
        self.logger.addHandler(health_handler)
        self.logger.setLevel(logging.INFO)

    def _load_config(self):
        """Load health monitoring configuration"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    config = json.load(f)
                    self.thresholds.update(config.get('thresholds', {}))
                    self.alert_channels.update(config.get('alert_channels', {}))
                    
            # Load from environment variables
            self.alert_channels['telegram_admin_chat'] = os.getenv('TELEGRAM_ADMIN_CHAT_ID')
            email_recipients = os.getenv('HEALTH_ALERT_EMAILS', '')
            if email_recipients:
                self.alert_channels['email_recipients'] = email_recipients.split(',')
            self.alert_channels['webhook_url'] = os.getenv('HEALTH_ALERT_WEBHOOK')
            
        except Exception as e:
            self.logger.warning(f"Failed to load health monitor config: {e}")

    async def collect_system_metrics(self) -> SystemHealth:
        """Collect comprehensive system health metrics"""
        # CPU usage
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_usage = (disk.used / disk.total) * 100
        
        # Network I/O
        network = psutil.net_io_counters()
        network_io = {
            'bytes_sent': network.bytes_sent,
            'bytes_recv': network.bytes_recv,
            'packets_sent': network.packets_sent,
            'packets_recv': network.packets_recv
        }
        
        # Check bot responsiveness
        bot_responsive = await self._check_bot_responsiveness()
        
        # Check database connectivity
        db_connected = await self._check_database_connectivity()
        
        # Check external APIs
        doodstream_status = await self._check_doodstream_api()
        telegram_status = await self._check_telegram_api()
        
        # Get upload metrics from database
        upload_metrics = await self._get_upload_metrics()
        
        return SystemHealth(
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            disk_usage=disk_usage,
            network_io=network_io,
            bot_responsiveness=bot_responsive,
            database_connectivity=db_connected,
            doodstream_api_status=doodstream_status,
            telegram_api_status=telegram_status,
            active_uploads=upload_metrics.get('active_uploads', 0),
            queue_size=upload_metrics.get('queue_size', 0),
            error_rate=upload_metrics.get('error_rate', 0.0)
        )

    async def _check_bot_responsiveness(self) -> bool:
        """Check if the Telegram bot is responsive"""
        try:
            if self.telegram_bot:
                # Try to get bot info
                bot_info = await self.telegram_bot.get_me()
                return bot_info is not None
            return True  # Assume responsive if no bot instance
        except Exception as e:
            self.logger.error(f"Bot responsiveness check failed: {e}")
            return False

    async def _check_database_connectivity(self) -> bool:
        """Check database connection health"""
        try:
            result = await self.supabase.table('profiles').select('count').limit(1).execute()
            return len(result.data) >= 0
        except Exception as e:
            self.logger.error(f"Database connectivity check failed: {e}")
            return False

    async def _check_doodstream_api(self) -> bool:
        """Check Doodstream API status"""
        try:
            doodstream_api_key = os.getenv('DOODSTREAM_API_KEY')
            if not doodstream_api_key:
                return True  # Skip if no API key configured
                
            async with aiohttp.ClientSession() as session:
                url = f"https://doodapi.com/api/account/info?key={doodstream_api_key}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('status') == 200
            return False
        except Exception as e:
            self.logger.error(f"Doodstream API check failed: {e}")
            return False

    async def _check_telegram_api(self) -> bool:
        """Check Telegram API status"""
        try:
            if self.telegram_bot:
                # Try to get updates
                await self.telegram_bot.get_updates(limit=1, timeout=5)
                return True
            return True  # Assume healthy if no bot instance
        except Exception as e:
            self.logger.error(f"Telegram API check failed: {e}")
            return False

    async def _get_upload_metrics(self) -> Dict:
        """Get upload-related health metrics from database"""
        try:
            # Get active uploads count
            active_result = await self.supabase.table('telegram_uploads')\
                .select('count')\
                .eq('upload_status', 'processing')\
                .execute()
            active_uploads = len(active_result.data) if active_result.data else 0
            
            # Get queue size
            queue_result = await self.supabase.table('telegram_uploads')\
                .select('count')\
                .eq('upload_status', 'pending')\
                .execute()
            queue_size = len(queue_result.data) if queue_result.data else 0
            
            # Calculate error rate (last hour)
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            total_result = await self.supabase.table('telegram_uploads')\
                .select('upload_status')\
                .gte('created_at', one_hour_ago.isoformat())\
                .execute()
            
            if total_result.data:
                total_count = len(total_result.data)
                failed_count = len([u for u in total_result.data if u['upload_status'] == 'failed'])
                error_rate = (failed_count / total_count) * 100 if total_count > 0 else 0
            else:
                error_rate = 0
            
            return {
                'active_uploads': active_uploads,
                'queue_size': queue_size,
                'error_rate': error_rate
            }
        except Exception as e:
            self.logger.error(f"Failed to get upload metrics: {e}")
            return {'active_uploads': 0, 'queue_size': 0, 'error_rate': 0}

    def _evaluate_health_status(self, health: SystemHealth) -> Tuple[str, List[str]]:
        """Evaluate overall health status and return issues"""
        issues = []
        status = "healthy"
        
        # Check CPU usage
        if health.cpu_usage >= self.thresholds['cpu_critical']:
            issues.append(f"CRITICAL: CPU usage at {health.cpu_usage:.1f}%")
            status = "critical"
        elif health.cpu_usage >= self.thresholds['cpu_warning']:
            issues.append(f"WARNING: CPU usage at {health.cpu_usage:.1f}%")
            if status != "critical":
                status = "warning"
        
        # Check memory usage
        if health.memory_usage >= self.thresholds['memory_critical']:
            issues.append(f"CRITICAL: Memory usage at {health.memory_usage:.1f}%")
            status = "critical"
        elif health.memory_usage >= self.thresholds['memory_warning']:
            issues.append(f"WARNING: Memory usage at {health.memory_usage:.1f}%")
            if status != "critical":
                status = "warning"
        
        # Check disk usage
        if health.disk_usage >= self.thresholds['disk_critical']:
            issues.append(f"CRITICAL: Disk usage at {health.disk_usage:.1f}%")
            status = "critical"
        elif health.disk_usage >= self.thresholds['disk_warning']:
            issues.append(f"WARNING: Disk usage at {health.disk_usage:.1f}%")
            if status != "critical":
                status = "warning"
        
        # Check error rate
        if health.error_rate >= self.thresholds['error_rate_critical']:
            issues.append(f"CRITICAL: Error rate at {health.error_rate:.1f}%")
            status = "critical"
        elif health.error_rate >= self.thresholds['error_rate_warning']:
            issues.append(f"WARNING: Error rate at {health.error_rate:.1f}%")
            if status != "critical":
                status = "warning"
        
        # Check connectivity
        if not health.bot_responsiveness:
            issues.append("CRITICAL: Bot not responding")
            status = "critical"
        
        if not health.database_connectivity:
            issues.append("CRITICAL: Database connection failed")
            status = "critical"
        
        if not health.doodstream_api_status:
            issues.append("WARNING: Doodstream API unreachable")
            if status == "healthy":
                status = "warning"
        
        if not health.telegram_api_status:
            issues.append("CRITICAL: Telegram API unreachable")
            status = "critical"
        
        # Check queue backlog
        if health.queue_size > 100:
            issues.append(f"WARNING: Large upload queue ({health.queue_size} items)")
            if status == "healthy":
                status = "warning"
        
        return status, issues

    async def send_alert(self, status: str, issues: List[str], health: SystemHealth):
        """Send health alerts through configured channels"""
        if not issues or status == "healthy":
            return
        
        # Check cooldown to avoid spam
        alert_key = f"{status}_{len(issues)}"
        current_time = datetime.utcnow()
        
        if alert_key in self.alert_cooldowns:
            last_alert = self.alert_cooldowns[alert_key]
            cooldown_minutes = 15 if status == "critical" else 60
            if (current_time - last_alert).total_seconds() < cooldown_minutes * 60:
                return  # Still in cooldown
        
        self.alert_cooldowns[alert_key] = current_time
        
        # Prepare alert message
        alert_message = self._format_alert_message(status, issues, health)
        
        # Send Telegram alert
        if self.alert_channels['telegram_admin_chat'] and self.telegram_bot:
            try:
                await self.telegram_bot.send_message(
                    chat_id=self.alert_channels['telegram_admin_chat'],
                    text=alert_message,
                    parse_mode='Markdown'
                )
            except Exception as e:
                self.logger.error(f"Failed to send Telegram alert: {e}")
        
        # Send email alert
        if self.alert_channels['email_recipients']:
            try:
                await self._send_email_alert(status, alert_message)
            except Exception as e:
                self.logger.error(f"Failed to send email alert: {e}")
        
        # Send webhook alert
        if self.alert_channels['webhook_url']:
            try:
                await self._send_webhook_alert(status, issues, health)
            except Exception as e:
                self.logger.error(f"Failed to send webhook alert: {e}")

    def _format_alert_message(self, status: str, issues: List[str], health: SystemHealth) -> str:
        """Format alert message for notifications"""
        emoji = "🚨" if status == "critical" else "⚠️"
        
        message = f"{emoji} *System Health Alert - {status.upper()}*\n\n"
        message += f"*Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
        
        message += "*Issues Detected:*\n"
        for issue in issues:
            message += f"• {issue}\n"
        
        message += f"\n*Current System Status:*\n"
        message += f"• CPU: {health.cpu_usage:.1f}%\n"
        message += f"• Memory: {health.memory_usage:.1f}%\n"
        message += f"• Disk: {health.disk_usage:.1f}%\n"
        message += f"• Active Uploads: {health.active_uploads}\n"
        message += f"• Queue Size: {health.queue_size}\n"
        message += f"• Error Rate: {health.error_rate:.1f}%\n"
        
        status_icons = {
            True: "✅",
            False: "❌"
        }
        
        message += f"• Bot Responsive: {status_icons[health.bot_responsiveness]}\n"
        message += f"• Database: {status_icons[health.database_connectivity]}\n"
        message += f"• Doodstream API: {status_icons[health.doodstream_api_status]}\n"
        message += f"• Telegram API: {status_icons[health.telegram_api_status]}\n"
        
        return message

    async def _send_email_alert(self, status: str, message: str):
        """Send email alert"""
        smtp_server = os.getenv('SMTP_SERVER', 'localhost')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_pass = os.getenv('SMTP_PASS')
        
        if not all([smtp_user, smtp_pass]):
            self.logger.warning("SMTP credentials not configured, skipping email alert")
            return
        
        msg = MimeMultipart()
        msg['From'] = smtp_user
        msg['Subject'] = f"Telegram Bot Health Alert - {status.upper()}"
        
        # Convert markdown to plain text for email
        plain_message = message.replace('*', '').replace('`', '')
        msg.attach(MimeText(plain_message, 'plain'))
        
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            
            for recipient in self.alert_channels['email_recipients']:
                msg['To'] = recipient.strip()
                server.send_message(msg)
                del msg['To']
            
            server.quit()
        except Exception as e:
            self.logger.error(f"SMTP error: {e}")

    async def _send_webhook_alert(self, status: str, issues: List[str], health: SystemHealth):
        """Send webhook alert"""
        webhook_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'status': status,
            'issues': issues,
            'health_data': asdict(health)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.alert_channels['webhook_url'],
                json=webhook_data,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status != 200:
                    self.logger.error(f"Webhook alert failed with status {response.status}")

    async def store_health_metrics(self, health: SystemHealth, status: str):
        """Store health metrics in database"""
        try:
            health_data = asdict(health)
            health_data['overall_status'] = status
            health_data['timestamp'] = datetime.utcnow().isoformat()
            
            await self.supabase.table('performance_metrics').insert({
                'metric_type': 'system_health',
                'metric_data': health_data
            }).execute()
            
        except Exception as e:
            self.logger.error(f"Failed to store health metrics: {e}")

    async def get_health_history(self, hours: int = 24) -> List[Dict]:
        """Get health history from database"""
        try:
            since_time = datetime.utcnow() - timedelta(hours=hours)
            
            result = await self.supabase.table('performance_metrics')\
                .select('*')\
                .eq('metric_type', 'system_health')\
                .gte('created_at', since_time.isoformat())\
                .order('created_at', desc=True)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Failed to get health history: {e}")
            return []

    async def generate_health_report(self) -> Dict:
        """Generate comprehensive health report"""
        current_health = await self.collect_system_metrics()
        status, issues = self._evaluate_health_status(current_health)
        
        # Get historical data for trends
        history = await self.get_health_history(24)
        
        # Calculate trends
        trends = self._calculate_trends(history)
        
        report = {
            'report_generated': datetime.utcnow().isoformat(),
            'current_status': status,
            'current_issues': issues,
            'current_metrics': asdict(current_health),
            'trends_24h': trends,
            'recommendations': self._generate_health_recommendations(current_health, trends)
        }
        
        return report

    def _calculate_trends(self, history: List[Dict]) -> Dict:
        """Calculate health trends from historical data"""
        if len(history) < 2:
            return {}
        
        # Extract metrics over time
        cpu_values = []
        memory_values = []
        disk_values = []
        error_rates = []
        
        for record in history:
            data = record.get('metric_data', {})
            cpu_values.append(data.get('cpu_usage', 0))
            memory_values.append(data.get('memory_usage', 0))
            disk_values.append(data.get('disk_usage', 0))
            error_rates.append(data.get('error_rate', 0))
        
        def calculate_trend(values):
            if len(values) < 2:
                return 0
            return (values[0] - values[-1]) / len(values)  # Simple trend calculation
        
        return {
            'cpu_trend': calculate_trend(cpu_values),
            'memory_trend': calculate_trend(memory_values),
            'disk_trend': calculate_trend(disk_values),
            'error_rate_trend': calculate_trend(error_rates),
            'avg_cpu_24h': sum(cpu_values) / len(cpu_values) if cpu_values else 0,
            'avg_memory_24h': sum(memory_values) / len(memory_values) if memory_values else 0,
            'max_error_rate_24h': max(error_rates) if error_rates else 0
        }

    def _generate_health_recommendations(self, health: SystemHealth, trends: Dict) -> List[str]:
        """Generate health recommendations based on current status and trends"""
        recommendations = []
        
        # CPU recommendations
        if health.cpu_usage > 80:
            recommendations.append("Consider adding more CPU resources or optimizing bot performance")
        elif trends.get('cpu_trend', 0) > 2:  # Increasing trend
            recommendations.append("CPU usage is trending upward, monitor for potential bottlenecks")
        
        # Memory recommendations
        if health.memory_usage > 85:
            recommendations.append("Memory usage is high, consider optimizing memory usage or adding RAM")
        elif trends.get('memory_trend', 0) > 2:
            recommendations.append("Memory usage is increasing, check for memory leaks")
        
        # Disk recommendations
        if health.disk_usage > 90:
            recommendations.append("Disk space is critically low, implement log rotation and cleanup")
        elif trends.get('disk_trend', 0) > 1:
            recommendations.append("Disk usage is growing, schedule regular cleanup tasks")
        
        # Error rate recommendations
        if health.error_rate > 10:
            recommendations.append("High error rate detected, investigate upload failures")
        elif trends.get('max_error_rate_24h', 0) > 15:
            recommendations.append("Error spikes detected in the last 24h, review error patterns")
        
        # Queue recommendations
        if health.queue_size > 50:
            recommendations.append("Upload queue is large, consider scaling upload processing")
        
        # Connectivity recommendations
        if not health.doodstream_api_status:
            recommendations.append("Doodstream API connectivity issues, verify API key and network")
        
        if not health.telegram_api_status:
            recommendations.append("Telegram API connectivity issues, check network and bot token")
        
        if not recommendations:
            recommendations.append("System health looks good, continue monitoring")
        
        return recommendations

    async def start_monitoring(self, interval_seconds: int = 60):
        """Start continuous health monitoring"""
        self.monitoring_active = True
        self.logger.info(f"Starting health monitoring with {interval_seconds}s interval...")
        
        while self.monitoring_active:
            try:
                # Collect health metrics
                health = await self.collect_system_metrics()
                
                # Evaluate health status
                status, issues = self._evaluate_health_status(health)
                
                # Store metrics in database
                await self.store_health_metrics(health, status)
                
                # Send alerts if needed
                await self.send_alert(status, issues, health)
                
                # Log current status
                self.logger.info(
                    f"Health check - Status: {status}, "
                    f"CPU: {health.cpu_usage:.1f}%, "
                    f"Memory: {health.memory_usage:.1f}%, "
                    f"Disk: {health.disk_usage:.1f}%, "
                    f"Queue: {health.queue_size}, "
                    f"Error Rate: {health.error_rate:.1f}%"
                )
                
                await asyncio.sleep(interval_seconds)
                
            except Exception as e:
                self.logger.error(f"Error in health monitoring: {e}")
                await asyncio.sleep(30)  # Shorter interval on error

    def stop_monitoring(self):
        """Stop health monitoring"""
        self.monitoring_active = False
        self.logger.info("Health monitoring stopped")