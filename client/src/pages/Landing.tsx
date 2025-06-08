import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: 'demo',
    password: 'password123'
  });
  const { toast } = useToast();

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/demo/login', formData);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to SecureBank!",
        });
        
        // Invalidate user query to refetch
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        
        // Reload the page to trigger auth state change
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplitLogin = () => {
    window.location.href = '/api/login';
  };

  const selectDemoAccount = (username: string, password: string) => {
    setFormData({ username, password });
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

        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full"
            />
          </div>
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Available Demo Accounts:</p>
          <p className="text-xs text-gray-600 mb-3">Click any card to auto-fill login form</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div 
              className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => selectDemoAccount('demo', 'password123')}
            >
              <p className="font-medium text-gray-900">demo / password123</p>
              <p className="text-gray-600">Demo User</p>
            </div>
            <div 
              className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => selectDemoAccount('john', 'john123')}
            >
              <p className="font-medium text-gray-900">john / john123</p>
              <p className="text-gray-600">John Doe</p>
            </div>
            <div 
              className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => selectDemoAccount('jane', 'jane123')}
            >
              <p className="font-medium text-gray-900">jane / jane123</p>
              <p className="text-gray-600">Jane Smith</p>
            </div>
            <div 
              className="bg-white p-2 rounded border cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => selectDemoAccount('admin', 'admin123')}
            >
              <p className="font-medium text-gray-900">admin / admin123</p>
              <p className="text-gray-600">Admin User</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button 
            variant="outline"
            onClick={handleReplitLogin}
            className="w-full"
          >
            Or Sign In with Replit
          </Button>
        </div>

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
