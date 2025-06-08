import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useBehavioralMonitoring } from '@/hooks/useBehavioralMonitoring';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface BehavioralContextType {
  isMonitoring: boolean;
  currentRiskScore: number;
  isAnomalous: boolean;
  startSession: () => void;
  stopSession: () => void;
  triggerReauth: () => void;
  securityStatus: 'secure' | 'warning' | 'critical';
}

const BehavioralContext = createContext<BehavioralContextType | null>(null);

export function useBehavioralContext() {
  const context = useContext(BehavioralContext);
  if (!context) {
    throw new Error('useBehavioralContext must be used within BehavioralProvider');
  }
  return context;
}

interface BehavioralProviderProps {
  children: ReactNode;
}

export function BehavioralProvider({ children }: BehavioralProviderProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [isAnomalous, setIsAnomalous] = useState(false);
  
  const { startMonitoring, stopMonitoring, extractFeatures, sessionId, isSessionActive } = useBehavioralMonitoring();
  const { analyzeCurrentBehavior } = useAnomalyDetection();

  // Create security event mutation
  const createSecurityEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/security/event', eventData);
      return response.json();
    }
  });

  const startSession = () => {
    const cleanup = startMonitoring();
    setIsMonitoring(true);
    
    // Return cleanup function
    return cleanup;
  };

  const stopSession = () => {
    stopMonitoring();
    setIsMonitoring(false);
    setCurrentRiskScore(0);
    setIsAnomalous(false);
  };

  const triggerReauth = () => {
    createSecurityEventMutation.mutate({
      eventType: 'reauth_required',
      riskScore: currentRiskScore,
      sessionId,
      details: {
        reason: 'behavioral_anomaly',
        timestamp: new Date().toISOString()
      }
    });
  };

  // Periodic behavioral analysis
  useEffect(() => {
    if (!isMonitoring || !isSessionActive) return;

    const analysisInterval = setInterval(async () => {
      try {
        const features = extractFeatures();
        const result = await analyzeCurrentBehavior(features, sessionId || undefined);
        
        setCurrentRiskScore(result.anomalyScore);
        setIsAnomalous(result.isAnomalous);
        
        // Log security event if anomaly detected
        if (result.isAnomalous) {
          createSecurityEventMutation.mutate({
            eventType: 'anomaly',
            riskScore: result.anomalyScore,
            sessionId,
            details: {
              featureVector: features,
              threshold: result.threshold,
              recommendation: result.recommendation
            }
          });
        }
      } catch (error) {
        console.error('Behavioral analysis error:', error);
      }
    }, 15000); // Analyze every 15 seconds

    return () => clearInterval(analysisInterval);
  }, [isMonitoring, isSessionActive, extractFeatures, analyzeCurrentBehavior, sessionId, createSecurityEventMutation]);

  const securityStatus = isAnomalous ? 'critical' : currentRiskScore > 0.6 ? 'warning' : 'secure';

  return (
    <BehavioralContext.Provider
      value={{
        isMonitoring,
        currentRiskScore,
        isAnomalous,
        startSession,
        stopSession,
        triggerReauth,
        securityStatus
      }}
    >
      {children}
    </BehavioralContext.Provider>
  );
}
