import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBehavioralContext } from '@/contexts/BehavioralContext';
import { useLocation } from 'wouter';

interface RiskAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onReauth: () => void;
}

export function RiskAlert({ isOpen, onClose, onReauth }: RiskAlertProps) {
  const { currentRiskScore, triggerReauth } = useBehavioralContext();
  const [, setLocation] = useLocation();

  if (!isOpen) return null;

  const handleReauth = () => {
    triggerReauth();
    onReauth();
    setLocation('/reauth');
  };

  const handleDismiss = () => {
    onClose();
    // Log dismissal
    console.log('Risk alert dismissed by user');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unusual Activity Detected</h3>
            <p className="text-sm text-gray-600">
              We've detected behavior patterns that don't match your usual usage.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">
              <strong>Risk Score:</strong> {(currentRiskScore * 100).toFixed(0)}/100
            </p>
            <div className="mt-2">
              <div className="w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentRiskScore * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center text-red-700">
              <i className="fas fa-mouse-pointer mr-2"></i>
              <span>Unusual touch pressure patterns</span>
            </div>
            <div className="flex items-center text-red-700">
              <i className="fas fa-clock mr-2"></i>
              <span>Different typing speed detected</span>
            </div>
            <div className="flex items-center text-red-700">
              <i className="fas fa-chart-line mr-2"></i>
              <span>Behavioral variance threshold exceeded</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleReauth}
            >
              Verify Identity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
