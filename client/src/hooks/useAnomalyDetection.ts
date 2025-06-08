import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AnomalyResult {
  anomalyScore: number;
  isAnomalous: boolean;
  threshold: number;
  recommendation: 'continue' | 'require_reauth';
  details: {
    mouseAnomalies: number;
    keystrokeAnomalies: number;
    touchAnomalies: number;
    sessionAnomalies: number;
  };
}

interface UserProfile {
  mouseVelocityMean: number;
  mouseVelocityStd: number;
  dwellTimeMean: number;
  dwellTimeStd: number;
  flightTimeMean: number;
  flightTimeStd: number;
  touchPressureMean: number;
  touchPressureStd: number;
}

export function useAnomalyDetection() {
  const userProfile = useRef<UserProfile | null>(null);
  const anomalyThreshold = 0.7; // Configurable threshold

  // Fetch user's behavioral profile
  const { data: profile } = useQuery({
    queryKey: ['/api/behavioral/profile'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (profile) {
      userProfile.current = profile;
    }
  }, [profile]);

  // Z-score normalization
  const calculateZScore = useCallback((value: number, mean: number, std: number): number => {
    if (std === 0) return 0;
    return Math.abs((value - mean) / std);
  }, []);

  // Statistical anomaly detection using Z-score
  const detectAnomalies = useCallback((featureVector: number[]): AnomalyResult => {
    if (!userProfile.current) {
      return {
        anomalyScore: 0,
        isAnomalous: false,
        threshold: anomalyThreshold,
        recommendation: 'continue',
        details: {
          mouseAnomalies: 0,
          keystrokeAnomalies: 0,
          touchAnomalies: 0,
          sessionAnomalies: 0
        }
      };
    }

    const [
      avgMouseVelocity,
      avgDwellTime,
      avgFlightTime,
      avgTouchPressure,
      mouseCount,
      keystrokeCount,
      touchCount,
      sessionDuration
    ] = featureVector;

    const profile = userProfile.current;

    // Calculate Z-scores for each feature
    const mouseVelocityZ = calculateZScore(avgMouseVelocity, profile.mouseVelocityMean, profile.mouseVelocityStd);
    const dwellTimeZ = calculateZScore(avgDwellTime, profile.dwellTimeMean, profile.dwellTimeStd);
    const flightTimeZ = calculateZScore(avgFlightTime, profile.flightTimeMean, profile.flightTimeStd);
    const touchPressureZ = calculateZScore(avgTouchPressure, profile.touchPressureMean, profile.touchPressureStd);

    // Weight different anomaly types
    const mouseAnomalies = mouseVelocityZ * 0.3;
    const keystrokeAnomalies = (dwellTimeZ * 0.4 + flightTimeZ * 0.3) * 0.4;
    const touchAnomalies = touchPressureZ * 0.2;
    const sessionAnomalies = 0.1; // Placeholder for session-based anomalies

    // Combined anomaly score (weighted average)
    const anomalyScore = (mouseAnomalies + keystrokeAnomalies + touchAnomalies + sessionAnomalies);

    const isAnomalous = anomalyScore > anomalyThreshold;
    const recommendation = anomalyScore > 1.0 ? 'require_reauth' : 'continue';

    return {
      anomalyScore,
      isAnomalous,
      threshold: anomalyThreshold,
      recommendation,
      details: {
        mouseAnomalies,
        keystrokeAnomalies,
        touchAnomalies,
        sessionAnomalies
      }
    };
  }, [calculateZScore, anomalyThreshold]);

  // Machine learning-based anomaly detection (simplified)
  const detectMLAnomalies = useCallback((featureVector: number[]): AnomalyResult => {
    if (!userProfile.current) {
      return detectAnomalies(featureVector);
    }

    // Simplified ML approach: Distance from user's normal behavior
    const profile = userProfile.current;
    const normalizedFeatures = [
      (featureVector[0] - profile.mouseVelocityMean) / (profile.mouseVelocityStd || 1),
      (featureVector[1] - profile.dwellTimeMean) / (profile.dwellTimeStd || 1),
      (featureVector[2] - profile.flightTimeMean) / (profile.flightTimeStd || 1),
      (featureVector[3] - profile.touchPressureMean) / (profile.touchPressureStd || 1)
    ];

    // Calculate Euclidean distance from user's normal pattern
    const distance = Math.sqrt(
      normalizedFeatures.reduce((sum, feature) => sum + feature * feature, 0)
    );

    // Convert distance to anomaly score (0-1 range)
    const anomalyScore = Math.min(distance / 3, 1); // Normalize to 0-1 range

    const isAnomalous = anomalyScore > anomalyThreshold;
    const recommendation = anomalyScore > 0.9 ? 'require_reauth' : 'continue';

    return {
      anomalyScore,
      isAnomalous,
      threshold: anomalyThreshold,
      recommendation,
      details: {
        mouseAnomalies: Math.abs(normalizedFeatures[0]),
        keystrokeAnomalies: (Math.abs(normalizedFeatures[1]) + Math.abs(normalizedFeatures[2])) / 2,
        touchAnomalies: Math.abs(normalizedFeatures[3]),
        sessionAnomalies: 0
      }
    };
  }, [detectAnomalies, anomalyThreshold]);

  // Temporal pattern analysis
  const analyzeTemporalPatterns = useCallback((timestamps: number[]): number => {
    if (timestamps.length < 3) return 0;

    // Calculate inter-event intervals
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Calculate rhythm consistency using coefficient of variation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    
    // Higher coefficient of variation indicates more irregular timing
    return Math.min(coefficientOfVariation, 1);
  }, []);

  // Comprehensive anomaly analysis
  const analyzeComprehensive = useCallback((behavioralData: any): AnomalyResult => {
    const { mouseMovements, keystrokes, touchEvents, sessionStart } = behavioralData;

    // Extract feature vector
    const mouseVelocities = mouseMovements.map((m: any) => m.velocity || 0);
    const avgMouseVelocity = mouseVelocities.length > 0 
      ? mouseVelocities.reduce((a: number, b: number) => a + b, 0) / mouseVelocities.length 
      : 0;

    const dwellTimes = keystrokes.map((k: any) => k.dwellTime || 0);
    const avgDwellTime = dwellTimes.length > 0 
      ? dwellTimes.reduce((a: number, b: number) => a + b, 0) / dwellTimes.length 
      : 0;

    const flightTimes = keystrokes.map((k: any) => k.flightTime || 0);
    const avgFlightTime = flightTimes.length > 0 
      ? flightTimes.reduce((a: number, b: number) => a + b, 0) / flightTimes.length 
      : 0;

    const touchPressures = touchEvents.map((t: any) => t.pressure);
    const avgTouchPressure = touchPressures.length > 0 
      ? touchPressures.reduce((a: number, b: number) => a + b, 0) / touchPressures.length 
      : 0;

    const featureVector = [
      avgMouseVelocity,
      avgDwellTime,
      avgFlightTime,
      avgTouchPressure,
      mouseMovements.length,
      keystrokes.length,
      touchEvents.length,
      Date.now() - sessionStart
    ];

    // Perform ML-based anomaly detection
    const result = detectMLAnomalies(featureVector);

    // Add temporal pattern analysis
    const mouseTimestamps = mouseMovements.map((m: any) => m.timestamp);
    const keystrokeTimestamps = keystrokes.map((k: any) => k.timestamp);
    
    const mouseTemporalAnomaly = analyzeTemporalPatterns(mouseTimestamps);
    const keystrokeTemporalAnomaly = analyzeTemporalPatterns(keystrokeTimestamps);

    // Combine temporal anomalies with existing score
    const temporalScore = (mouseTemporalAnomaly + keystrokeTemporalAnomaly) / 2;
    const finalScore = (result.anomalyScore * 0.8) + (temporalScore * 0.2);

    return {
      ...result,
      anomalyScore: finalScore,
      isAnomalous: finalScore > anomalyThreshold,
      recommendation: finalScore > 0.9 ? 'require_reauth' : 'continue',
      details: {
        ...result.details,
        sessionAnomalies: temporalScore
      }
    };
  }, [detectMLAnomalies, analyzeTemporalPatterns, anomalyThreshold]);

  // Report anomaly to server
  const reportAnomalyMutation = useMutation({
    mutationFn: async (anomalyData: AnomalyResult & { sessionId: number }) => {
      const response = await apiRequest('POST', '/api/behavioral/anomaly', anomalyData);
      return response.json();
    }
  });

  return {
    detectAnomalies: analyzeComprehensive,
    reportAnomaly: reportAnomalyMutation.mutate,
    isReporting: reportAnomalyMutation.isPending,
    userProfile: userProfile.current,
    threshold: anomalyThreshold
  };
}