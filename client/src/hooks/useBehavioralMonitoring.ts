import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
  velocity?: number;
}

interface KeystrokeData {
  key: string;
  timestamp: number;
  dwellTime?: number;
  flightTime?: number;
}

interface TouchEvent {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

interface BehavioralData {
  mouseMovements: MouseMovement[];
  keystrokes: KeystrokeData[];
  touchEvents: TouchEvent[];
  sessionStart: number;
}

export function useBehavioralMonitoring() {
  const behavioralData = useRef<BehavioralData>({
    mouseMovements: [],
    keystrokes: [],
    touchEvents: [],
    sessionStart: Date.now()
  });

  const sessionId = useRef<number | null>(null);

  // Create behavioral session
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/behavioral/session', {
        metadata: { userAgent: navigator.userAgent, screenResolution: `${screen.width}x${screen.height}` }
      });
      return response.json();
    },
    onSuccess: (data) => {
      sessionId.current = data.id;
    }
  });

  // Send behavioral metrics
  const sendMetricMutation = useMutation({
    mutationFn: async ({ metricType, data }: { metricType: string; data: any }) => {
      if (!sessionId.current) return;
      
      const response = await apiRequest('POST', '/api/behavioral/metric', {
        sessionId: sessionId.current,
        metricType,
        data
      });
      return response.json();
    }
  });

  // Extract behavioral features for ML model
  const extractFeatures = useCallback(() => {
    const { mouseMovements, keystrokes, touchEvents } = behavioralData.current;
    
    // Mouse movement features
    const mouseVelocities = mouseMovements.map(m => m.velocity || 0);
    const avgMouseVelocity = mouseVelocities.length > 0 
      ? mouseVelocities.reduce((a, b) => a + b, 0) / mouseVelocities.length 
      : 0;
    
    // Keystroke features
    const dwellTimes = keystrokes.map(k => k.dwellTime || 0);
    const avgDwellTime = dwellTimes.length > 0 
      ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length 
      : 0;
    
    const flightTimes = keystrokes.map(k => k.flightTime || 0);
    const avgFlightTime = flightTimes.length > 0 
      ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length 
      : 0;
    
    // Touch features
    const touchPressures = touchEvents.map(t => t.pressure);
    const avgTouchPressure = touchPressures.length > 0 
      ? touchPressures.reduce((a, b) => a + b, 0) / touchPressures.length 
      : 0;
    
    // Return feature vector
    return [
      avgMouseVelocity,
      avgDwellTime,
      avgFlightTime,
      avgTouchPressure,
      mouseMovements.length,
      keystrokes.length,
      touchEvents.length,
      Date.now() - behavioralData.current.sessionStart // session duration
    ];
  }, []);

  // Track mouse movements
  const trackMouseMovement = useCallback((event: MouseEvent) => {
    const now = Date.now();
    const lastMovement = behavioralData.current.mouseMovements[behavioralData.current.mouseMovements.length - 1];
    
    let velocity = 0;
    if (lastMovement) {
      const distance = Math.sqrt(
        Math.pow(event.clientX - lastMovement.x, 2) + 
        Math.pow(event.clientY - lastMovement.y, 2)
      );
      const timeDiff = now - lastMovement.timestamp;
      velocity = timeDiff > 0 ? distance / timeDiff : 0;
    }
    
    const movement: MouseMovement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
      velocity
    };
    
    behavioralData.current.mouseMovements.push(movement);
    
    // Keep only last 100 movements
    if (behavioralData.current.mouseMovements.length > 100) {
      behavioralData.current.mouseMovements.shift();
    }
  }, []);

  // Track keystrokes
  const trackKeystroke = useCallback((event: KeyboardEvent, eventType: 'keydown' | 'keyup') => {
    const now = Date.now();
    
    if (eventType === 'keydown') {
      const keystroke: KeystrokeData = {
        key: event.key,
        timestamp: now
      };
      behavioralData.current.keystrokes.push(keystroke);
    } else if (eventType === 'keyup') {
      // Find matching keydown event to calculate dwell time
      const keydownIndex = behavioralData.current.keystrokes.findIndex(
        k => k.key === event.key && !k.dwellTime
      );
      
      if (keydownIndex !== -1) {
        const keystroke = behavioralData.current.keystrokes[keydownIndex];
        keystroke.dwellTime = now - keystroke.timestamp;
        
        // Calculate flight time (time between key releases)
        if (keydownIndex > 0) {
          const prevKeystroke = behavioralData.current.keystrokes[keydownIndex - 1];
          if (prevKeystroke.dwellTime) {
            keystroke.flightTime = keystroke.timestamp - (prevKeystroke.timestamp + prevKeystroke.dwellTime);
          }
        }
      }
    }
    
    // Keep only last 50 keystrokes
    if (behavioralData.current.keystrokes.length > 50) {
      behavioralData.current.keystrokes.shift();
    }
  }, []);

  // Track touch events
  const trackTouchEvent = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const touchData: TouchEvent = {
        x: touch.clientX,
        y: touch.clientY,
        pressure: (touch as any).force || Math.random(), // Simulated pressure
        timestamp: Date.now()
      };
      
      behavioralData.current.touchEvents.push(touchData);
      
      // Keep only last 50 touch events
      if (behavioralData.current.touchEvents.length > 50) {
        behavioralData.current.touchEvents.shift();
      }
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    createSessionMutation.mutate();
    
    // Add event listeners
    document.addEventListener('mousemove', trackMouseMovement);
    document.addEventListener('keydown', (e) => trackKeystroke(e, 'keydown'));
    document.addEventListener('keyup', (e) => trackKeystroke(e, 'keyup'));
    document.addEventListener('touchstart', trackTouchEvent);
    document.addEventListener('touchmove', trackTouchEvent);
    
    // Send metrics periodically
    const interval = setInterval(() => {
      const features = extractFeatures();
      sendMetricMutation.mutate({
        metricType: 'aggregated',
        data: {
          featureVector: features,
          mouseMovements: behavioralData.current.mouseMovements.slice(-10),
          keystrokes: behavioralData.current.keystrokes.slice(-10),
          touchEvents: behavioralData.current.touchEvents.slice(-10)
        }
      });
    }, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousemove', trackMouseMovement);
      document.removeEventListener('keydown', (e) => trackKeystroke(e, 'keydown'));
      document.removeEventListener('keyup', (e) => trackKeystroke(e, 'keyup'));
      document.removeEventListener('touchstart', trackTouchEvent);
      document.removeEventListener('touchmove', trackTouchEvent);
    };
  }, [trackMouseMovement, trackKeystroke, trackTouchEvent, extractFeatures, createSessionMutation, sendMetricMutation]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (sessionId.current) {
      apiRequest('PATCH', `/api/behavioral/session/${sessionId.current}`, {
        sessionEnd: new Date().toISOString(),
        featureVector: { final: extractFeatures() }
      });
    }
  }, [extractFeatures]);

  return {
    startMonitoring,
    stopMonitoring,
    extractFeatures,
    sessionId: sessionId.current,
    isSessionActive: createSessionMutation.isSuccess && sessionId.current !== null
  };
}
