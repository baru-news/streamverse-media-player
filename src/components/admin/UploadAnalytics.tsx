import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  FileVideo, 
  Users, 
  CalendarDays,
  Download
} from "lucide-react";

interface UploadStats {
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  success_rate: number;
  avg_upload_time: number;
  total_file_size: number;
}

interface ChartData {
  date: string;
  uploads: number;
  successes: number;
  failures: number;
  success_rate: number;
}

interface ProviderStats {
  provider: string;
  uploads: number;
  success_rate: number;
  avg_speed: number;
  total_size: number;
}

interface ErrorPattern {
  error_type: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export function UploadAnalytics() {
  const { user, isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalyticsData();
    }
  }, [isAdmin, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch upload statistics
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('telegram_uploads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (uploadsError) throw uploadsError;

      // Process upload stats
      const totalUploads = uploadsData?.length || 0;
      const successfulUploads = uploadsData?.filter(u => u.upload_status === 'completed').length || 0;
      const failedUploads = uploadsData?.filter(u => u.upload_status === 'failed').length || 0;
      const successRate = totalUploads > 0 ? (successfulUploads / totalUploads) * 100 : 0;

      setUploadStats({
        total_uploads: totalUploads,
        successful_uploads: successfulUploads,
        failed_uploads: failedUploads,
        success_rate: successRate,
        avg_upload_time: 120, // Mock data in seconds
        total_file_size: uploadsData?.reduce((sum, u) => sum + (u.file_size || 0), 0) || 0
      });

      // Generate mock chart data for visualization
      const mockChartData: ChartData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dayUploads = Math.floor(Math.random() * 20) + 5;
        const daySuccesses = Math.floor(dayUploads * (0.85 + Math.random() * 0.1));
        const dayFailures = dayUploads - daySuccesses;
        
        mockChartData.push({
          date: date.toISOString().split('T')[0],
          uploads: dayUploads,
          successes: daySuccesses,
          failures: dayFailures,
          success_rate: dayUploads > 0 ? (daySuccesses / dayUploads) * 100 : 0
        });
      }
      setChartData(mockChartData);

      // Mock provider statistics
      setProviderStats([
        {
          provider: 'Doodstream Regular',
          uploads: Math.floor(totalUploads * 0.6),
          success_rate: 92.5,
          avg_speed: 2.3, // MB/s
          total_size: Math.floor((uploadsData?.reduce((sum, u) => sum + (u.file_size || 0), 0) || 0) * 0.6)
        },
        {
          provider: 'Doodstream Premium',
          uploads: Math.floor(totalUploads * 0.4),
          success_rate: 88.7,
          avg_speed: 3.1, // MB/s
          total_size: Math.floor((uploadsData?.reduce((sum, u) => sum + (u.file_size || 0), 0) || 0) * 0.4)
        }
      ]);

      // Mock error patterns
      setErrorPatterns([
        { error_type: 'Network Timeout', count: 45, percentage: 35.2, trend: 'down' },
        { error_type: 'File Too Large', count: 28, percentage: 21.9, trend: 'stable' },
        { error_type: 'API Rate Limit', count: 22, percentage: 17.2, trend: 'up' },
        { error_type: 'Invalid Format', count: 18, percentage: 14.1, trend: 'down' },
        { error_type: 'Auth Failed', count: 15, percentage: 11.7, trend: 'stable' }
      ]);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Upload Analytics</h2>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold mt-1">{uploadStats?.total_uploads || 0}</p>
              </div>
              <FileVideo className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {uploadStats?.success_rate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Upload Time</p>
                <p className="text-2xl font-bold mt-1">
                  {formatDuration(uploadStats?.avg_upload_time || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold mt-1">
                  {formatFileSize(uploadStats?.total_file_size || 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Upload Trends</TabsTrigger>
          <TabsTrigger value="providers">Provider Comparison</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="uploads" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="successes" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                  <Line type="monotone" dataKey="success_rate" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerStats.map((provider, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{provider.provider}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Uploads:</span>
                    <span className="font-medium">{provider.uploads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">{provider.success_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Speed:</span>
                    <span className="font-medium">{provider.avg_speed} MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-medium">{formatFileSize(provider.total_size)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorPatterns}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="error_type"
                  >
                    {errorPatterns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorPatterns.map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{error.error_type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {error.count} ({error.percentage}%)
                      </span>
                      <div className={`flex items-center gap-1 text-sm ${
                        error.trend === 'up' ? 'text-red-500' : 
                        error.trend === 'down' ? 'text-green-500' : 
                        'text-yellow-500'
                      }`}>
                        {error.trend === 'up' ? '↑' : error.trend === 'down' ? '↓' : '→'}
                        {error.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Speed Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="uploads" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}