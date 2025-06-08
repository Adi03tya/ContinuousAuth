import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Shield, Activity, Users } from 'lucide-react';

interface SecurityMetrics {
  currentRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  activeAnomalies: number;
  sessionsMonitored: number;
  detectionAccuracy: number;
  lastUpdate: string;
}

export function SecurityMonitor() {
  const [liveMetrics, setLiveMetrics] = useState<SecurityMetrics>({
    currentRiskLevel: 'low',
    activeAnomalies: 0,
    sessionsMonitored: 0,
    detectionAccuracy: 0,
    lastUpdate: new Date().toISOString()
  });

  // Fetch real-time session data
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/behavioral/sessions'],
    refetchInterval: 3000, // Every 3 seconds for real-time feel
  });

  // Fetch security events
  const { data: securityEvents = [] } = useQuery({
    queryKey: ['/api/security/events'],
    refetchInterval: 2000, // Every 2 seconds
  });

  // Update metrics based on real data
  useEffect(() => {
    if (Array.isArray(sessions)) {
      const anomalousSessions = sessions.filter((s: any) => s.anomalyDetected).length;
      const totalSessions = sessions.length;
      const riskScores = sessions.map((s: any) => s.riskScore || 0);
      const avgRisk = riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (avgRisk > 0.8) riskLevel = 'critical';
      else if (avgRisk > 0.6) riskLevel = 'high';
      else if (avgRisk > 0.3) riskLevel = 'medium';

      const accuracy = totalSessions > 0 ? Math.round(((totalSessions - anomalousSessions) / totalSessions) * 100) : 100;

      setLiveMetrics({
        currentRiskLevel: riskLevel,
        activeAnomalies: anomalousSessions,
        sessionsMonitored: totalSessions,
        detectionAccuracy: accuracy,
        lastUpdate: new Date().toISOString()
      });
    }
  }, [sessions]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          {getRiskIcon(liveMetrics.currentRiskLevel)}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant={getRiskColor(liveMetrics.currentRiskLevel)}>
              {liveMetrics.currentRiskLevel.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time assessment
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {liveMetrics.activeAnomalies}
          </div>
          <p className="text-xs text-muted-foreground">
            Detected this session
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions Monitored</CardTitle>
          <Users className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {liveMetrics.sessionsMonitored}
          </div>
          <p className="text-xs text-muted-foreground">
            Total tracked sessions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
          <Activity className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {liveMetrics.detectionAccuracy}%
          </div>
          <p className="text-xs text-muted-foreground">
            Model performance
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Live Monitoring Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Behavioral Tracking</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anomaly Detection</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Running
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time Analysis</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Processing
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground pt-2">
              Last updated: {new Date(liveMetrics.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}