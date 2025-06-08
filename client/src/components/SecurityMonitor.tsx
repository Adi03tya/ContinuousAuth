import { useBehavioralContext } from '@/contexts/BehavioralContext';

export function SecurityMonitor() {
  const { isMonitoring, securityStatus, currentRiskScore } = useBehavioralContext();

  if (!isMonitoring) return null;

  const getStatusColor = () => {
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

  const getStatusIcon = () => {
    switch (securityStatus) {
      case 'secure':
        return 'fas fa-shield-alt';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'critical':
        return 'fas fa-ban';
      default:
        return 'fas fa-shield-alt';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-full p-3 shadow-lg border border-gray-200 z-50">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${securityStatus === 'secure' ? 'bg-green-500 animate-pulse' : securityStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <div className="flex items-center">
          <i className={`${getStatusIcon()} text-sm mr-1 ${getStatusColor().split(' ')[1]}`}></i>
          <span className="text-xs font-medium text-gray-700">
            {securityStatus === 'secure' ? 'Secure' : securityStatus === 'warning' ? 'Monitoring' : 'Alert'}
          </span>
        </div>
      </div>
      {currentRiskScore > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Risk: {(currentRiskScore * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
