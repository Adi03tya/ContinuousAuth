import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-800">
      {/* Header */}
      <div className="pt-16 pb-8 px-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
          <i className="fas fa-shield-alt text-primary text-2xl"></i>
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">SecureBank</h1>
        <p className="text-blue-100 text-sm">Behavioral Authentication</p>
      </div>

      {/* Login Card */}
      <div className="flex-1 bg-white rounded-t-3xl mx-4 px-6 pt-8 pb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
          <p className="text-gray-600">Sign in to access your secure banking</p>
        </div>

        <Button 
          onClick={handleLogin}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In with Replit
        </Button>

        {/* Security Notice */}
        <Card className="mt-8 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-primary mr-2 mt-0.5"></i>
              <div>
                <p className="text-sm text-primary font-medium">Behavioral Security Active</p>
                <p className="text-xs text-blue-600 mt-1">
                  We continuously monitor your usage patterns to keep your account secure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Advanced Security Features</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-brain text-primary"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Continuous Monitoring</p>
                <p className="text-xs text-gray-600">Real-time behavioral analysis</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-fingerprint text-green-600"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Biometric Security</p>
                <p className="text-xs text-gray-600">Multi-factor authentication</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-shield-alt text-purple-600"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Adaptive Authentication</p>
                <p className="text-xs text-gray-600">Risk-based security responses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
