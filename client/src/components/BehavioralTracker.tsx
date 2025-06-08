import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MousePattern {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
  pressure: number;
}

interface KeystrokePattern {
  key: string;
  keyCode: number;
  timestamp: number;
  dwellTime: number;
  flightTime: number;
  pressure: number;
}

interface TouchPattern {
  x: number;
  y: number;
  timestamp: number;
  pressure: number;
  area: number;
  duration: number;
}

interface BehavioralFeatures {
  mouseVelocityStats: { mean: number; std: number; max: number; min: number };
  keystrokeTimingStats: { dwellMean: number; flightMean: number; rhythm: number };
  touchPressureStats: { mean: number; std: number; consistency: number };
  sessionMetrics: { duration: number; eventCount: number; errorRate: number };
}

export function BehavioralTracker() {
  const sessionId = useRef<number | null>(null);
  const mouseBuffer = useRef<MousePattern[]>([]);
  const keystrokeBuffer = useRef<KeystrokePattern[]>([]);
  const touchBuffer = useRef<TouchPattern[]>([]);
  const sessionStart = useRef<number>(Date.now());
  const lastMouseEvent = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const lastKeystroke = useRef<{ key: string; timestamp: number } | null>(null);

  // Create behavioral session
  const createSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/behavioral/session', {
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          deviceMemory: (navigator as any).deviceMemory || 'unknown',
          hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      sessionId.current = data.id;
      console.log('Behavioral session created:', data.id);
    }
  });

  // Send behavioral metrics
  const sendMetrics = useMutation({
    mutationFn: async (features: BehavioralFeatures) => {
      if (!sessionId.current) return;
      
      const response = await apiRequest('POST', '/api/behavioral/metric', {
        sessionId: sessionId.current,
        metricType: 'comprehensive',
        data: {
          features,
          rawData: {
            mouseEvents: mouseBuffer.current.slice(-20),
            keystrokeEvents: keystrokeBuffer.current.slice(-20),
            touchEvents: touchBuffer.current.slice(-20)
          },
          timestamp: new Date().toISOString()
        }
      });
      return response.json();
    }
  });

  // Analyze for anomalies
  const analyzeAnomaly = useMutation({
    mutationFn: async (features: BehavioralFeatures) => {
      const featureVector = [
        features.mouseVelocityStats.mean,
        features.keystrokeTimingStats.dwellMean,
        features.keystrokeTimingStats.flightMean,
        features.touchPressureStats.mean,
        features.sessionMetrics.eventCount,
        features.sessionMetrics.duration
      ];

      const response = await apiRequest('POST', '/api/behavioral/analyze', {
        sessionId: sessionId.current,
        featureVector
      });
      return response.json();
    }
  });

  // Calculate mouse movement features
  const calculateMouseFeatures = useCallback((events: MousePattern[]) => {
    if (events.length < 2) return { mean: 0, std: 0, max: 0, min: 0 };

    const velocities = events.map(e => e.velocity).filter(v => v > 0);
    if (velocities.length === 0) return { mean: 0, std: 0, max: 0, min: 0 };

    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    const std = Math.sqrt(variance);
    const max = Math.max(...velocities);
    const min = Math.min(...velocities);

    return { mean, std, max, min };
  }, []);

  // Calculate keystroke timing features
  const calculateKeystrokeFeatures = useCallback((events: KeystrokePattern[]) => {
    if (events.length < 2) return { dwellMean: 0, flightMean: 0, rhythm: 0 };

    const dwellTimes = events.map(e => e.dwellTime).filter(d => d > 0);
    const flightTimes = events.map(e => e.flightTime).filter(f => f > 0);

    const dwellMean = dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0;
    const flightMean = flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;

    // Calculate rhythm consistency (coefficient of variation)
    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].timestamp - events[i-1].timestamp);
    }
    
    const intervalMean = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
    const intervalStd = intervals.length > 0 ? Math.sqrt(
      intervals.reduce((sum, interval) => sum + Math.pow(interval - intervalMean, 2), 0) / intervals.length
    ) : 0;
    
    const rhythm = intervalMean > 0 ? intervalStd / intervalMean : 0;

    return { dwellMean, flightMean, rhythm };
  }, []);

  // Calculate touch pressure features
  const calculateTouchFeatures = useCallback((events: TouchPattern[]) => {
    if (events.length === 0) return { mean: 0, std: 0, consistency: 0 };

    const pressures = events.map(e => e.pressure);
    const mean = pressures.reduce((a, b) => a + b, 0) / pressures.length;
    const variance = pressures.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pressures.length;
    const std = Math.sqrt(variance);
    const consistency = std > 0 ? mean / std : 1; // Higher is more consistent

    return { mean, std, consistency };
  }, []);

  // Mouse movement tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const now = Date.now();
    const last = lastMouseEvent.current;

    let velocity = 0;
    let acceleration = 0;

    if (last) {
      const distance = Math.sqrt(
        Math.pow(event.clientX - last.x, 2) + Math.pow(event.clientY - last.y, 2)
      );
      const timeDiff = now - last.timestamp;
      velocity = timeDiff > 0 ? distance / timeDiff : 0;

      // Calculate acceleration (change in velocity)
      const lastPattern = mouseBuffer.current[mouseBuffer.current.length - 1];
      if (lastPattern) {
        acceleration = velocity - lastPattern.velocity;
      }
    }

    const pattern: MousePattern = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
      velocity,
      acceleration,
      pressure: (event as any).pressure || 0.5 // Simulated pressure
    };

    mouseBuffer.current.push(pattern);
    if (mouseBuffer.current.length > 100) {
      mouseBuffer.current.shift();
    }

    lastMouseEvent.current = { x: event.clientX, y: event.clientY, timestamp: now };
  }, []);

  // Keystroke tracking
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const now = Date.now();
    lastKeystroke.current = { key: event.key, timestamp: now };
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const now = Date.now();
    const lastKey = lastKeystroke.current;

    if (lastKey && lastKey.key === event.key) {
      const dwellTime = now - lastKey.timestamp;
      
      // Calculate flight time from previous keystroke
      const lastPattern = keystrokeBuffer.current[keystrokeBuffer.current.length - 1];
      const flightTime = lastPattern ? lastKey.timestamp - (lastPattern.timestamp + lastPattern.dwellTime) : 0;

      const pattern: KeystrokePattern = {
        key: event.key,
        keyCode: event.keyCode,
        timestamp: lastKey.timestamp,
        dwellTime,
        flightTime: Math.max(0, flightTime),
        pressure: (event as any).pressure || Math.random() * 0.3 + 0.5 // Simulated pressure
      };

      keystrokeBuffer.current.push(pattern);
      if (keystrokeBuffer.current.length > 50) {
        keystrokeBuffer.current.shift();
      }
    }

    lastKeystroke.current = null;
  }, []);

  // Touch tracking
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const now = Date.now();

      const pattern: TouchPattern = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: now,
        pressure: (touch as any).force || Math.random() * 0.4 + 0.3,
        area: (touch as any).radiusX * (touch as any).radiusY || 100,
        duration: 0 // Will be updated on touch end
      };

      touchBuffer.current.push(pattern);
      if (touchBuffer.current.length > 50) {
        touchBuffer.current.shift();
      }
    }
  }, []);

  // Extract and analyze features periodically
  const analyzeFeatures = useCallback(() => {
    const mouseFeatures = calculateMouseFeatures(mouseBuffer.current);
    const keystrokeFeatures = calculateKeystrokeFeatures(keystrokeBuffer.current);
    const touchFeatures = calculateTouchFeatures(touchBuffer.current);

    const sessionDuration = Date.now() - sessionStart.current;
    const totalEvents = mouseBuffer.current.length + keystrokeBuffer.current.length + touchBuffer.current.length;

    const features: BehavioralFeatures = {
      mouseVelocityStats: mouseFeatures,
      keystrokeTimingStats: keystrokeFeatures,
      touchPressureStats: touchFeatures,
      sessionMetrics: {
        duration: sessionDuration,
        eventCount: totalEvents,
        errorRate: 0 // Could track typing errors, click misses, etc.
      }
    };

    // Send metrics to server
    sendMetrics.mutate(features);

    // Analyze for anomalies if we have enough data
    if (totalEvents > 20) {
      analyzeAnomaly.mutate(features);
    }
  }, [calculateMouseFeatures, calculateKeystrokeFeatures, calculateTouchFeatures, sendMetrics, analyzeAnomaly]);

  // Initialize tracking
  useEffect(() => {
    createSession.mutate();

    const analysisInterval = setInterval(analyzeFeatures, 15000); // Every 15 seconds

    return () => {
      clearInterval(analysisInterval);
      // Send final session data
      if (sessionId.current) {
        try {
          apiRequest('PATCH', `/api/behavioral/session/${sessionId.current}`, {
            sessionEnd: new Date().toISOString()
          }).catch(() => {
            // Silently handle cleanup errors since user is leaving
          });
        } catch (error) {
          // Silently handle cleanup errors since user is leaving
        }
      }
    };
  }, []);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });
    document.addEventListener('keyup', handleKeyUp, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleMouseMove, handleKeyDown, handleKeyUp, handleTouchStart]);

  return null; // This component just tracks, doesn't render anything
}