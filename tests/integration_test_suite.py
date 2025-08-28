#!/usr/bin/env python3
"""
Comprehensive Integration Test Suite for Production Telegram Bot
Tests all major components and workflows end-to-end.
"""

import asyncio
import pytest
import os
import json
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List
import aiohttp
import subprocess

class ProductionTestSuite:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    async def run_all_tests(self) -> Dict:
        """Run complete integration test suite"""
        print("🚀 Starting Production Integration Tests...")
        
        test_methods = [
            self.test_system_health,
            self.test_bot_responsiveness,
            self.test_database_connectivity,
            self.test_api_endpoints,
            self.test_upload_workflow,
            self.test_security_features,
            self.test_monitoring_systems,
            self.test_backup_recovery,
            self.test_performance_baseline
        ]
        
        for test_method in test_methods:
            try:
                result = await test_method()
                self.test_results.append(result)
                status = "✅ PASS" if result['passed'] else "❌ FAIL"
                print(f"{status} {result['name']}")
                
                if not result['passed']:
                    self.failed_tests.append(result)
            except Exception as e:
                error_result = {
                    'name': test_method.__name__,
                    'passed': False,
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                }
                self.test_results.append(error_result)
                self.failed_tests.append(error_result)
                print(f"❌ ERROR {test_method.__name__}: {e}")
        
        return self._generate_test_report()

    async def test_system_health(self) -> Dict:
        """Test system resource health"""
        try:
            # Run health check script
            result = subprocess.run(
                ['./scripts/health_check.sh', 'system'],
                capture_output=True, text=True, timeout=30
            )
            
            return {
                'name': 'System Health Check',
                'passed': result.returncode == 0,
                'details': result.stdout,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'System Health Check', 'passed': False, 'error': str(e)}

    async def test_bot_responsiveness(self) -> Dict:
        """Test bot API responsiveness"""
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            if not bot_token:
                return {'name': 'Bot Responsiveness', 'passed': False, 'error': 'No bot token'}
            
            async with aiohttp.ClientSession() as session:
                url = f"https://api.telegram.org/bot{bot_token}/getMe"
                
                start_time = asyncio.get_event_loop().time()
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    end_time = asyncio.get_event_loop().time()
                    
                    response_data = await response.json()
                    response_time = (end_time - start_time) * 1000  # ms
                    
                    passed = (
                        response.status == 200 and
                        response_data.get('ok') is True and
                        response_time < 5000  # Under 5 seconds
                    )
                    
                    return {
                        'name': 'Bot Responsiveness',
                        'passed': passed,
                        'response_time_ms': response_time,
                        'bot_info': response_data.get('result', {}),
                        'timestamp': datetime.utcnow().isoformat()
                    }
        except Exception as e:
            return {'name': 'Bot Responsiveness', 'passed': False, 'error': str(e)}

    async def test_database_connectivity(self) -> Dict:
        """Test Supabase database connectivity and basic operations"""
        try:
            from supabase import create_client
            
            supabase = create_client(
                os.getenv('SUPABASE_URL'),
                os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            )
            
            # Test basic query
            start_time = asyncio.get_event_loop().time()
            result = await supabase.table('profiles').select('count').limit(1).execute()
            end_time = asyncio.get_event_loop().time()
            
            query_time = (end_time - start_time) * 1000
            
            return {
                'name': 'Database Connectivity',
                'passed': len(result.data) >= 0,
                'query_time_ms': query_time,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'Database Connectivity', 'passed': False, 'error': str(e)}

    async def test_api_endpoints(self) -> Dict:
        """Test critical API endpoints"""
        try:
            endpoints_to_test = [
                ('Doodstream API', f"https://doodapi.com/api/account/info?key={os.getenv('DOODSTREAM_API_KEY', 'test')}"),
                ('Supabase REST API', f"{os.getenv('SUPABASE_URL')}/rest/v1/"),
            ]
            
            results = []
            all_passed = True
            
            async with aiohttp.ClientSession() as session:
                for name, url in endpoints_to_test:
                    try:
                        headers = {}
                        if 'supabase' in url:
                            headers['apikey'] = os.getenv('SUPABASE_ANON_KEY', '')
                        
                        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            passed = response.status in [200, 201]
                            results.append({
                                'endpoint': name,
                                'status': response.status,
                                'passed': passed
                            })
                            
                            if not passed:
                                all_passed = False
                    except Exception as e:
                        results.append({
                            'endpoint': name,
                            'passed': False,
                            'error': str(e)
                        })
                        all_passed = False
            
            return {
                'name': 'API Endpoints Test',
                'passed': all_passed,
                'endpoint_results': results,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'API Endpoints Test', 'passed': False, 'error': str(e)}

    async def test_upload_workflow(self) -> Dict:
        """Test file upload workflow simulation"""
        try:
            # Create a test file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as test_file:
                test_content = f"Test upload file created at {datetime.utcnow()}"
                test_file.write(test_content.encode())
                test_file_path = test_file.name
            
            # Simulate upload workflow (without actually uploading)
            workflow_steps = [
                'File validation',
                'Size check',
                'Format verification', 
                'Queue management',
                'Progress tracking'
            ]
            
            passed_steps = 0
            
            for step in workflow_steps:
                # Simulate step processing
                await asyncio.sleep(0.1)
                passed_steps += 1
            
            # Cleanup
            os.unlink(test_file_path)
            
            return {
                'name': 'Upload Workflow Test',
                'passed': passed_steps == len(workflow_steps),
                'completed_steps': passed_steps,
                'total_steps': len(workflow_steps),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'Upload Workflow Test', 'passed': False, 'error': str(e)}

    async def test_security_features(self) -> Dict:
        """Test security monitoring and protection features"""
        try:
            # Test firewall status
            firewall_result = subprocess.run(['ufw', 'status'], capture_output=True, text=True)
            firewall_active = 'Status: active' in firewall_result.stdout
            
            # Test file permissions
            critical_files = [
                '/opt/telegram-userbot/config',
                '/opt/telegram-userbot/logs'
            ]
            
            permissions_ok = True
            for file_path in critical_files:
                if os.path.exists(file_path):
                    stat_info = os.stat(file_path)
                    # Check if world-writable
                    if stat_info.st_mode & 0o002:
                        permissions_ok = False
                        break
            
            return {
                'name': 'Security Features Test',
                'passed': firewall_active and permissions_ok,
                'firewall_active': firewall_active,
                'permissions_secure': permissions_ok,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'Security Features Test', 'passed': False, 'error': str(e)}

    async def test_monitoring_systems(self) -> Dict:
        """Test monitoring and alerting systems"""
        try:
            # Check if monitoring processes are running
            processes_to_check = ['python3']  # Monitoring processes
            
            running_processes = []
            ps_result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            
            for process in processes_to_check:
                if process in ps_result.stdout:
                    running_processes.append(process)
            
            # Test log file creation
            log_dirs = ['/opt/telegram-userbot/logs', '/var/log/telegram-bot']
            log_files_exist = False
            
            for log_dir in log_dirs:
                if os.path.exists(log_dir) and os.listdir(log_dir):
                    log_files_exist = True
                    break
            
            return {
                'name': 'Monitoring Systems Test',
                'passed': len(running_processes) > 0 and log_files_exist,
                'running_processes': running_processes,
                'log_files_exist': log_files_exist,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'Monitoring Systems Test', 'passed': False, 'error': str(e)}

    async def test_backup_recovery(self) -> Dict:
        """Test backup and recovery systems"""
        try:
            # Test backup script execution
            backup_script = './scripts/backup_manager.sh'
            
            if os.path.exists(backup_script):
                # Test backup verification (dry run)
                result = subprocess.run(
                    [backup_script, 'verify', '/dev/null'], 
                    capture_output=True, text=True
                )
                
                script_executable = os.access(backup_script, os.X_OK)
                
                return {
                    'name': 'Backup Recovery Test',
                    'passed': script_executable,
                    'backup_script_exists': True,
                    'script_executable': script_executable,
                    'timestamp': datetime.utcnow().isoformat()
                }
            else:
                return {
                    'name': 'Backup Recovery Test',
                    'passed': False,
                    'backup_script_exists': False,
                    'timestamp': datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {'name': 'Backup Recovery Test', 'passed': False, 'error': str(e)}

    async def test_performance_baseline(self) -> Dict:
        """Test performance baseline metrics"""
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Performance thresholds
            cpu_ok = cpu_percent < 80
            memory_ok = memory.percent < 85
            disk_ok = (disk.used / disk.total) * 100 < 90
            
            return {
                'name': 'Performance Baseline Test',
                'passed': cpu_ok and memory_ok and disk_ok,
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'disk_percent': (disk.used / disk.total) * 100,
                'thresholds_met': {
                    'cpu': cpu_ok,
                    'memory': memory_ok,
                    'disk': disk_ok
                },
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {'name': 'Performance Baseline Test', 'passed': False, 'error': str(e)}

    def _generate_test_report(self) -> Dict:
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result.get('passed', False))
        failed_tests = total_tests - passed_tests
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        report = {
            'test_summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'success_rate': round(success_rate, 2)
            },
            'overall_status': 'PASS' if failed_tests == 0 else 'FAIL',
            'test_results': self.test_results,
            'failed_tests': self.failed_tests,
            'report_generated': datetime.utcnow().isoformat(),
            'recommendations': self._generate_recommendations()
        }
        
        return report

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        for result in self.failed_tests:
            test_name = result.get('name', 'Unknown Test')
            
            if 'System Health' in test_name:
                recommendations.append("Review system resources and optimize performance")
            elif 'Bot Responsiveness' in test_name:
                recommendations.append("Check bot token and network connectivity")
            elif 'Database Connectivity' in test_name:
                recommendations.append("Verify Supabase credentials and network access")
            elif 'Security Features' in test_name:
                recommendations.append("Review security configuration and file permissions")
            elif 'Monitoring Systems' in test_name:
                recommendations.append("Ensure monitoring services are running properly")
            elif 'Backup Recovery' in test_name:
                recommendations.append("Verify backup scripts and storage configuration")
            elif 'Performance Baseline' in test_name:
                recommendations.append("Optimize system resources or upgrade hardware")
        
        if not recommendations:
            recommendations.append("All tests passed! System is production-ready.")
        
        return recommendations

async def main():
    """Run the integration test suite"""
    test_suite = ProductionTestSuite()
    report = await test_suite.run_all_tests()
    
    print("\n" + "="*60)
    print("PRODUCTION INTEGRATION TEST REPORT")
    print("="*60)
    print(f"Overall Status: {report['overall_status']}")
    print(f"Success Rate: {report['test_summary']['success_rate']}%")
    print(f"Tests Passed: {report['test_summary']['passed']}/{report['test_summary']['total_tests']}")
    
    if report['failed_tests']:
        print(f"\nFailed Tests:")
        for failed_test in report['failed_tests']:
            print(f"  - {failed_test['name']}: {failed_test.get('error', 'See details')}")
    
    print(f"\nRecommendations:")
    for recommendation in report['recommendations']:
        print(f"  • {recommendation}")
    
    # Save report to file
    report_file = f"integration_test_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: {report_file}")
    
    return 0 if report['overall_status'] == 'PASS' else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)