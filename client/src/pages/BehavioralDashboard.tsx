import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BehavioralTracker } from '@/components/BehavioralTracker';
import { SecurityMonitor } from '@/components/SecurityMonitor';
import { useQuery } from '@tanstack/react-query';

export default function BehavioralDashboard() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/demo/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Fetch real behavioral sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/behavioral/sessions'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery({
    queryKey: ['/api/security/events'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch behavioral profile
  const { data: profile } = useQuery({
    queryKey: ['/api/behavioral/profile'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Process real session data for charts
  const processSessionData = () => {
    if (!sessions.length) return { typingPatterns: [], riskScoreData: [], sessionData: [] };

    const typingPatterns = sessions.slice(-7).map((session, index) => ({
      time: new Date(session.sessionStart).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      speed: session.featureVector?.vector?.[1] || Math.random() * 20 + 60,
      accuracy: Math.max(85, 100 - (session.riskScore || 0) * 15)
    }));

    const riskScoreData = sessions.slice(-7).map((session, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index % 7],
      score: Math.round((session.riskScore || 0) * 100)
    }));

    const secureCount = sessions.filter(s => !s.anomalyDetected).length;
    const flaggedCount = sessions.filter(s => s.anomalyDetected && (s.riskScore || 0) < 0.8).length;
    const blockedCount = sessions.filter(s => s.anomalyDetected && (s.riskScore || 0) >= 0.8).length;

    const sessionData = [
      { name: 'Secure Sessions', value: secureCount, color: '#10b981' },
      { name: 'Flagged Sessions', value: flaggedCount, color: '#f59e0b' },
      { name: 'Blocked Sessions', value: blockedCount, color: '#ef4444' }
    ];

    return { typingPatterns, riskScoreData, sessionData };
  };

  const { typingPatterns, riskScoreData, sessionData } = processSessionData();

  const mousePatterns = [
    { metric: 'Speed', value: profile?.mouseVelocityMean || 1.2, unit: 'px/ms' },
    { metric: 'Acceleration', value: 0.8, unit: 'm/s²' },
    { metric: 'Click Duration', value: profile?.dwellTimeMean || 145, unit: 'ms' },
    { metric: 'Pressure', value: profile?.touchPressureMean || 0.7, unit: 'force' }
  ];

  const biometricMetrics = [
    { type: 'Keystroke Dynamics', confidence: 96, status: 'stable' },
    { type: 'Mouse Movement', confidence: 94, status: 'stable' },
    { type: 'Touch Patterns', confidence: 89, status: 'learning' },
    { type: 'Device Motion', confidence: 92, status: 'stable' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <BehavioralTracker />
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-3">
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Behavioral Patterns</h1>
              <p className="text-sm text-gray-600">Monitor your authentication patterns and security metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700">
              <div className="w-2 h-2 rounded-full mr-2 bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">Monitoring Active</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt mr-1"></i>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Real-time Security Monitoring */}
        <SecurityMonitor />

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Security Score</p>
                  <p className="text-2xl font-bold text-green-600">96.2%</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-shield-alt text-green-600"></i>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">+2.1% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions Today</p>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-blue-600"></i>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Average: 8 sessions/day</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Anomalies</p>
                  <p className="text-2xl font-bold text-orange-600">2</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-orange-600"></i>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">-1 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Trust Level</p>
                  <p className="text-2xl font-bold text-purple-600">High</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-check text-purple-600"></i>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Established over 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Typing Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-keyboard mr-2 text-blue-600"></i>
                Typing Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={typingPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} name="Speed (WPM)" />
                  <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Score Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-chart-line mr-2 text-orange-600"></i>
                Risk Score Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={riskScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Session Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-pie-chart mr-2 text-purple-600"></i>
                Session Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sessionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {sessionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {sessionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mouse Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-mouse-pointer mr-2 text-green-600"></i>
                Mouse Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mousePatterns.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pattern.metric}</p>
                      <p className="text-xs text-gray-500">{pattern.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{pattern.value}</p>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{ width: `${Math.min(pattern.value * 50, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Biometric Confidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-fingerprint mr-2 text-blue-600"></i>
                Biometric Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {biometricMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{metric.type}</p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={metric.status === 'stable' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {metric.status}
                        </Badge>
                        <span className="text-sm font-semibold">{metric.confidence}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300" 
                        style={{ width: `${metric.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-history mr-2 text-gray-600"></i>
              Recent Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-check text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Successful Authentication</p>
                    <p className="text-xs text-gray-500">Behavioral patterns matched - High confidence</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-exclamation-triangle text-yellow-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Minor Anomaly Detected</p>
                    <p className="text-xs text-gray-500">Typing speed 15% slower than usual</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-sync text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pattern Update</p>
                    <p className="text-xs text-gray-500">Mouse movement patterns updated and learned</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">3 hours ago</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-shield-alt text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security Profile Enhanced</p>
                    <p className="text-xs text-gray-500">Added new touch pattern recognition</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}