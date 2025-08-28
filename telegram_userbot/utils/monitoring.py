"""
Performance Monitoring for Telegram Upload Bot - Phase 4
"""

import asyncio
import logging
import time
import json
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from utils.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Performance metric data structure"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage: float
    network_bytes_sent: int
    network_bytes_recv: int
    active_connections: int
    response_time: Optional[float] = None
    error_count: int = 0

class PerformanceMonitor:
    """Enhanced performance monitoring with intelligent alerts"""
    
    def __init__(self, supabase: SupabaseManager):
        self.supabase = supabase
        self.metrics_buffer: List[PerformanceMetric] = []
        self.alert_thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'disk_usage': 90.0,
            'response_time': 5.0,
            'error_rate': 0.1
        }
        self.is_monitoring = False
        
    async def start_monitoring(self, interval: int = 60):
        """Start continuous performance monitoring"""
        self.is_monitoring = True
        logger.info("Starting performance monitoring...")
        
        while self.is_monitoring:
            try:
                metric = await self._collect_system_metrics()
                self.metrics_buffer.append(metric)
                
                # Store metrics every 5 minutes
                if len(self.metrics_buffer) >= 5:
                    await self._store_metrics()
                    self.metrics_buffer.clear()
                
                # Check for alerts
                await self._check_alerts(metric)
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                logger.error(f"Error in performance monitoring: {e}")
                await asyncio.sleep(interval)
    
    async def stop_monitoring(self):
        """Stop performance monitoring"""
        self.is_monitoring = False
        
        # Store remaining metrics
        if self.metrics_buffer:
            await self._store_metrics()
            self.metrics_buffer.clear()
        
        logger.info("Performance monitoring stopped")
    
    async def _collect_system_metrics(self) -> PerformanceMetric:
        """Collect comprehensive system metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100
            
            # Network
            net_io = psutil.net_io_counters()
            
            # Active connections
            connections = len(psutil.net_connections())
            
            return PerformanceMetric(
                timestamp=datetime.now(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_usage=disk_usage,
                network_bytes_sent=net_io.bytes_sent,
                network_bytes_recv=net_io.bytes_recv,
                active_connections=connections
            )
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return PerformanceMetric(
                timestamp=datetime.now(),
                cpu_percent=0.0,
                memory_percent=0.0,
                disk_usage=0.0,
                network_bytes_sent=0,
                network_bytes_recv=0,
                active_connections=0,
                error_count=1
            )
    
    async def _store_metrics(self):
        """Store metrics in database"""
        try:
            metrics_data = []
            for metric in self.metrics_buffer:
                metrics_data.append({
                    'timestamp': metric.timestamp.isoformat(),
                    'cpu_percent': metric.cpu_percent,
                    'memory_percent': metric.memory_percent,
                    'disk_usage': metric.disk_usage,
                    'network_bytes_sent': metric.network_bytes_sent,
                    'network_bytes_recv': metric.network_bytes_recv,
                    'active_connections': metric.active_connections,
                    'response_time': metric.response_time,
                    'error_count': metric.error_count
                })
            
            result = self.supabase.client.table('performance_metrics').insert(metrics_data).execute()
            logger.info(f"Stored {len(metrics_data)} performance metrics")
            
        except Exception as e:
            logger.error(f"Error storing performance metrics: {e}")
    
    async def _check_alerts(self, metric: PerformanceMetric):
        """Check metrics against thresholds and trigger alerts"""
        alerts = []
        
        # CPU Alert
        if metric.cpu_percent > self.alert_thresholds['cpu_percent']:
            alerts.append(f"High CPU usage: {metric.cpu_percent:.1f}%")
        
        # Memory Alert
        if metric.memory_percent > self.alert_thresholds['memory_percent']:
            alerts.append(f"High memory usage: {metric.memory_percent:.1f}%")
        
        # Disk Alert
        if metric.disk_usage > self.alert_thresholds['disk_usage']:
            alerts.append(f"High disk usage: {metric.disk_usage:.1f}%")
        
        # Response Time Alert
        if metric.response_time and metric.response_time > self.alert_thresholds['response_time']:
            alerts.append(f"Slow response time: {metric.response_time:.2f}s")
        
        if alerts:
            await self._send_alerts(alerts)
    
    async def _send_alerts(self, alerts: List[str]):
        """Send performance alerts"""
        try:
            alert_data = {
                'timestamp': datetime.now().isoformat(),
                'alert_type': 'performance',
                'severity': 'warning',
                'message': '; '.join(alerts),
                'details': {'alerts': alerts}
            }
            
            # Store alert in database
            self.supabase.client.table('system_alerts').insert(alert_data).execute()
            
            logger.warning(f"Performance alerts: {', '.join(alerts)}")
            
        except Exception as e:
            logger.error(f"Error sending alerts: {e}")
    
    async def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance summary for the last N hours"""
        try:
            since = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            result = self.supabase.client.table('performance_metrics')\
                .select('*')\
                .gte('timestamp', since)\
                .order('timestamp', desc=True)\
                .execute()
            
            metrics = result.data or []
            
            if not metrics:
                return {'status': 'no_data', 'period_hours': hours}
            
            # Calculate averages
            avg_cpu = sum(m['cpu_percent'] for m in metrics) / len(metrics)
            avg_memory = sum(m['memory_percent'] for m in metrics) / len(metrics)
            avg_disk = sum(m['disk_usage'] for m in metrics) / len(metrics)
            
            # Calculate peaks
            max_cpu = max(m['cpu_percent'] for m in metrics)
            max_memory = max(m['memory_percent'] for m in metrics)
            max_disk = max(m['disk_usage'] for m in metrics)
            
            return {
                'status': 'healthy',
                'period_hours': hours,
                'metrics_count': len(metrics),
                'averages': {
                    'cpu_percent': round(avg_cpu, 2),
                    'memory_percent': round(avg_memory, 2),
                    'disk_usage': round(avg_disk, 2)
                },
                'peaks': {
                    'cpu_percent': max_cpu,
                    'memory_percent': max_memory,
                    'disk_usage': max_disk
                },
                'latest_timestamp': metrics[0]['timestamp'] if metrics else None
            }
            
        except Exception as e:
            logger.error(f"Error getting performance summary: {e}")
            return {'status': 'error', 'error': str(e)}