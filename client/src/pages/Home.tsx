import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useBehavioralContext } from '@/contexts/BehavioralContext';
import { SecurityMonitor } from '@/components/SecurityMonitor';
import { RiskAlert } from '@/components/RiskAlert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user } = useAuth();
  const { startSession, isAnomalous, securityStatus } = useBehavioralContext();
  const [, setLocation] = useLocation();
  const [showRiskAlert, setShowRiskAlert] = useState(false);

  // Fetch user accounts
  const { data: accounts } = useQuery({
    queryKey: ['/api/accounts'],
  });

  // Fetch recent transactions
  const { data: transactions } = useQuery({
    queryKey: ['/api/accounts', accounts?.[0]?.id, 'transactions'],
    enabled: !!accounts?.[0]?.id,
  });

  // Start behavioral monitoring on mount
  useEffect(() => {
    const cleanup = startSession();
    return cleanup;
  }, [startSession]);

  // Show risk alert when anomaly detected
  useEffect(() => {
    if (isAnomalous) {
      setShowRiskAlert(true);
    }
  }, [isAnomalous]);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const primaryAccount = accounts?.[0];
  const recentTransactions = transactions?.slice(0, 3) || [];

  const getSecurityStatusColor = () => {
    switch (securityStatus) {
      case 'secure':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover" 
                />
              ) : (
                <i className="fas fa-user text-white"></i>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Good morning,</p>
              <p className="font-semibold text-gray-900">{user?.firstName || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-2 py-1 rounded-full ${getSecurityStatusColor()}`}>
              <div className={`w-2 h-2 rounded-full mr-1 ${securityStatus === 'secure' ? 'bg-green-500' : securityStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-xs font-medium">
                {securityStatus === 'secure' ? 'Secure' : securityStatus === 'warning' ? 'Monitoring' : 'Alert'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-6 py-4">
        <Card className="bg-gradient-to-r from-primary to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm">Total Balance</p>
                <p className="text-3xl font-bold">
                  ${primaryAccount?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <i className="fas fa-credit-card text-white"></i>
              </div>
            </div>
            <div className="flex items-center text-sm text-blue-100">
              <i className="fas fa-eye mr-2"></i>
              <span>{primaryAccount?.accountNumber || '****0000'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-paper-plane text-primary"></i>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Transfer Money</h4>
              <p className="text-sm text-gray-500">Send to friends & family</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-chart-line text-green-600"></i>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Check Balance</h4>
              <p className="text-sm text-gray-500">View account details</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-history text-purple-600"></i>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Transaction History</h4>
              <p className="text-sm text-gray-500">Recent activity</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/profile')}
          >
            <CardContent className="p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <i className="fas fa-user text-orange-600"></i>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">My Profile</h4>
              <p className="text-sm text-gray-500">Account settings</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Behavioral Monitoring Status */}
      <div className="px-6 py-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Security Monitoring</h4>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Your behavioral patterns are being monitored for enhanced security.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2 text-center">
                <i className="fas fa-mouse-pointer text-primary mb-1"></i>
                <p className="text-gray-600">Touch Patterns</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <i className="fas fa-keyboard text-primary mb-1"></i>
                <p className="text-gray-600">Typing Rhythm</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <i className="fas fa-mobile-alt text-primary mb-1"></i>
                <p className="text-gray-600">Device Motion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Button variant="link" size="sm" className="text-primary">
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentTransactions.map((transaction, index) => (
            <Card key={transaction.id || index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <i className={`fas ${
                        transaction.type === 'credit' ? 'fa-plus text-green-600' : 
                        transaction.category === 'food' ? 'fa-coffee text-red-600' :
                        transaction.category === 'shopping' ? 'fa-shopping-cart text-red-600' :
                        'fa-minus text-red-600'
                      }`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Security Monitor */}
      <SecurityMonitor />

      {/* Risk Alert */}
      <RiskAlert
        isOpen={showRiskAlert}
        onClose={() => setShowRiskAlert(false)}
        onReauth={() => setShowRiskAlert(false)}
      />
    </div>
  );
}
