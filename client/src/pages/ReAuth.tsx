import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBehavioralContext } from '@/contexts/BehavioralContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ReAuth() {
  const { user } = useAuth();
  const { currentRiskScore } = useBehavioralContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [verificationMethod, setVerificationMethod] = useState<'pin' | 'biometric' | 'sms' | null>(null);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);

  // Create security event for reauth attempt
  const createSecurityEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/security/event', eventData);
      return response.json();
    }
  });

  const handleVerificationMethodSelect = (method: 'pin' | 'biometric' | 'sms') => {
    setVerificationMethod(method);
    
    // Log the verification attempt
    createSecurityEventMutation.mutate({
      eventType: 'reauth_attempt',
      details: {
        method,
        timestamp: new Date().toISOString(),
        riskScore: currentRiskScore
      }
    });
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePinVerification = async () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Simulate PIN verification (in real app, this would verify against stored PIN)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Log successful reauth
      await createSecurityEventMutation.mutateAsync({
        eventType: 'reauth_success',
        details: {
          method: 'pin',
          timestamp: new Date().toISOString(),
          previousRiskScore: currentRiskScore
        },
        resolved: true
      });

      toast({
        title: "Verification Successful",
        description: "Access restored. Welcome back!",
        variant: "default"
      });

      // Redirect back to home
      setTimeout(() => {
        setLocation('/');
      }, 1000);

    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Please try again or use a different method",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBiometricVerification = async () => {
    setIsVerifying(true);
    
    try {
      // Simulate biometric verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log successful reauth
      await createSecurityEventMutation.mutateAsync({
        eventType: 'reauth_success',
        details: {
          method: 'biometric',
          timestamp: new Date().toISOString(),
          previousRiskScore: currentRiskScore
        },
        resolved: true
      });

      toast({
        title: "Biometric Verification Successful",
        description: "Access restored. Welcome back!",
        variant: "default"
      });

      setTimeout(() => {
        setLocation('/');
      }, 1000);

    } catch (error) {
      toast({
        title: "Biometric Verification Failed",
        description: "Please try again or use a different method",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-6 py-8">
        {/* Alert Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-orange-600 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Check Required</h2>
          <p className="text-gray-600">
            We detected unusual activity patterns. Please verify your identity to continue.
          </p>
        </div>

        {/* Anomaly Details */}
        <Card className="mb-6 bg-orange-50">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Detected Anomalies:</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <i className="fas fa-mouse-pointer text-orange-600 mr-2"></i>
                <span className="text-gray-700">Unusual touch pressure patterns</span>
              </div>
              <div className="flex items-center text-sm">
                <i className="fas fa-clock text-orange-600 mr-2"></i>
                <span className="text-gray-700">Different typing speed detected</span>
              </div>
              <div className="flex items-center text-sm">
                <i className="fas fa-chart-line text-orange-600 mr-2"></i>
                <span className="text-gray-700">Behavioral variance threshold exceeded</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-orange-700">
              <strong>Risk Score: {(currentRiskScore * 100).toFixed(0)}/100</strong> (Threshold: 80)
            </div>
          </CardContent>
        </Card>

        {/* Verification Options */}
        {!verificationMethod && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Choose verification method:</h3>
            
            <Button 
              className="w-full bg-primary text-white py-4 h-auto"
              onClick={() => handleVerificationMethodSelect('pin')}
            >
              <div className="flex items-center">
                <i className="fas fa-lock mr-3"></i>
                <div className="text-left">
                  <p className="font-medium">Enter PIN</p>
                  <p className="text-sm opacity-90">Use your 6-digit PIN</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="w-full py-4 h-auto"
              onClick={() => handleVerificationMethodSelect('biometric')}
            >
              <div className="flex items-center">
                <i className="fas fa-fingerprint text-primary mr-3"></i>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Biometric Scan</p>
                  <p className="text-sm text-gray-600">Fingerprint or Face ID</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline"
              className="w-full py-4 h-auto"
              onClick={() => handleVerificationMethodSelect('sms')}
            >
              <div className="flex items-center">
                <i className="fas fa-sms text-primary mr-3"></i>
                <div className="text-left">
                  <p className="font-medium text-gray-900">SMS Code</p>
                  <p className="text-sm text-gray-600">Send code to ****1234</p>
                </div>
              </div>
            </Button>
          </div>
        )}

        {/* PIN Entry */}
        {verificationMethod === 'pin' && (
          <div className="space-y-6">
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setVerificationMethod(null)}
                className="mb-4"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to options
              </Button>
              <h3 className="font-medium text-gray-900 mb-4">Enter your 6-digit PIN</h3>
            </div>
            
            <div className="grid grid-cols-6 gap-2 mb-6">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  className="h-12 text-center text-xl font-bold"
                />
              ))}
            </div>
            
            <Button 
              className="w-full bg-primary text-white"
              onClick={handlePinVerification}
              disabled={isVerifying || pin.some(d => !d)}
            >
              {isVerifying ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Verifying...
                </>
              ) : (
                'Verify PIN'
              )}
            </Button>
          </div>
        )}

        {/* Biometric Verification */}
        {verificationMethod === 'biometric' && (
          <div className="space-y-6 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setVerificationMethod(null)}
              className="mb-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to options
            </Button>
            
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <i className="fas fa-fingerprint text-primary text-3xl"></i>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-2">Biometric Verification</h3>
            <p className="text-gray-600 mb-6">Please use your fingerprint or face ID to verify your identity</p>
            
            <Button 
              className="w-full bg-primary text-white"
              onClick={handleBiometricVerification}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Scanning...
                </>
              ) : (
                <>
                  <i className="fas fa-fingerprint mr-2"></i>
                  Start Biometric Scan
                </>
              )}
            </Button>
          </div>
        )}

        {/* SMS Verification */}
        {verificationMethod === 'sms' && (
          <div className="space-y-6 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setVerificationMethod(null)}
              className="mb-4"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to options
            </Button>
            
            <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <i className="fas fa-sms text-green-600 text-3xl"></i>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-2">SMS Verification</h3>
            <p className="text-gray-600 mb-6">
              We've sent a verification code to your registered phone number ending in ****1234
            </p>
            
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            
            <Button className="w-full bg-primary text-white">
              Verify Code
            </Button>
            
            <Button variant="link" size="sm">
              Resend Code
            </Button>
          </div>
        )}

        {/* Cancel Option */}
        <div className="mt-8 text-center">
          <Button 
            variant="link" 
            size="sm"
            className="text-gray-500 hover:text-gray-700"
            onClick={handleLogout}
          >
            Logout instead
          </Button>
        </div>
      </div>
    </div>
  );
}
