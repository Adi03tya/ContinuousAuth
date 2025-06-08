import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';

export default function Profile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
  });

  // Fetch recent security events
  const { data: securityEvents } = useQuery({
    queryKey: ['/api/security/events'],
  });

  const handleGoBack = () => {
    setLocation('/');
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex items-center">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mr-4">
          <i className="fas fa-arrow-left text-gray-600"></i>
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
      </div>

      {/* Profile Info */}
      <div className="px-6 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover mr-4" 
                />
              ) : (
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user text-white text-2xl"></i>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(user?.createdAt || '').getFullYear()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">1</div>
                <div className="text-sm text-gray-600">Active Accounts</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.securityScore || 95}%
                </div>
                <div className="text-sm text-gray-600">Security Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <div className="px-6 py-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <Card>
          <CardContent className="p-0">
            
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-brain text-green-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Behavioral Authentication</p>
                    <p className="text-sm text-gray-500">Continuous monitoring active</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-600 font-medium mr-2">ON</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-fingerprint text-primary"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Biometric Login</p>
                    <p className="text-sm text-gray-500">Fingerprint & Face ID</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-600 font-medium mr-2">ON</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-bell text-orange-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Security Alerts</p>
                    <p className="text-sm text-gray-500">Notifications for anomalies</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-green-600 font-medium mr-2">ON</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-chart-bar text-purple-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Analytics Dashboard</p>
                    <p className="text-sm text-gray-500">View security insights</p>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Summary */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analytics?.sessionsToday || 0}
                </div>
                <div className="text-sm text-gray-600">Sessions Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.anomaliesDetected || 0}
                </div>
                <div className="text-sm text-gray-600">Anomalies Detected</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.lastLogin 
                    ? new Date(analytics.lastLogin).toLocaleString()
                    : 'No data'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Average Session</span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics?.avgSessionDuration || '8 minutes'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Risk Level</span>
                <span className={`text-sm font-medium ${
                  analytics?.riskLevel === 'Low' ? 'text-green-600' :
                  analytics?.riskLevel === 'Medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {analytics?.riskLevel || 'Low'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      {securityEvents && securityEvents.length > 0 && (
        <div className="px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h3>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {securityEvents.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        event.eventType === 'anomaly' ? 'bg-red-100' :
                        event.eventType === 'reauth' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        <i className={`fas text-xs ${
                          event.eventType === 'anomaly' ? 'fa-exclamation-triangle text-red-600' :
                          event.eventType === 'reauth' ? 'fa-shield-alt text-yellow-600' :
                          'fa-check text-green-600'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {event.eventType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {event.riskScore && (
                      <span className="text-xs text-gray-600">
                        Risk: {(event.riskScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logout Button */}
      <div className="px-6 py-4">
        <Button 
          variant="outline" 
          className="w-full text-red-600 border-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
