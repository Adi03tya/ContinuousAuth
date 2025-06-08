import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useCallback } from 'react';

interface AnomalyResult {
  anomalyScore: number;
  isAnomalous: boolean;
  threshold: number;
  recommendation: 'continue' | 'require_reauth';
}

export function useAnomalyDetection() {
  const analyzeBehaviorMutation = useMutation({
    mutationFn: async ({ featureVector, sessionId }: { featureVector: number[]; sessionId?: number }) => {
      const response = await apiRequest('POST', '/api/behavioral/analyze', {
        featureVector,
        sessionId
      });
      return response.json() as Promise<AnomalyResult>;
    }
  });

  const analyzeCurrentBehavior = useCallback(async (featureVector: number[], sessionId?: number) => {
    try {
      const result = await analyzeBehaviorMutation.mutateAsync({ featureVector, sessionId });
      return result;
    } catch (error) {
      console.error('Anomaly analysis failed:', error);
      // Return safe default
      return {
        anomalyScore: 0,
        isAnomalous: false,
        threshold: 0.8,
        recommendation: 'continue' as const
      };
    }
  }, [analyzeBehaviorMutation]);

  return {
    analyzeCurrentBehavior,
    isAnalyzing: analyzeBehaviorMutation.isPending,
    lastResult: analyzeBehaviorMutation.data
  };
}
