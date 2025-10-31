'use client';

import { Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import React, { useState } from 'react';

import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';
import type { Organization, UserWithOrganization } from '../types';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

interface LoginProps {
  onLogin: (userData: UserWithOrganization) => void;
  onCreateOrganization: () => void;
  isLoading: boolean;
}

// Mock organizations and users - in real app this would be backend API
const mockOrganizations: Organization[] = [
  {
    id: 'org1',
    name: 'Gavith Construction Pvt. Ltd.',
    subscription: 'premium',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'org2',
    name: 'ABC Construction Co.',
    subscription: 'basic',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'system',
  },
];

const mockUsers: UserWithOrganization[] = [
  {
    id: 'user1',
    username: 'admin',
    email: 'admin@gavithconstruction.com',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'admin',
    organizationId: 'org1',
    organizationRole: 'owner',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    organization: mockOrganizations[0],
  },
  {
    id: 'user2',
    username: 'manager',
    email: 'manager@gavithconstruction.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'user',
    organizationId: 'org1',
    organizationRole: 'manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    organization: mockOrganizations[0],
  },
  {
    id: 'user3',
    username: 'engineer',
    email: 'engineer@abcconstruction.com',
    firstName: 'Amit',
    lastName: 'Patel',
    role: 'user',
    organizationId: 'org2',
    organizationRole: 'user',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    organization: mockOrganizations[1],
  },
];

// For demonstration, we'll use simple password matching
const userCredentials = [
  { username: 'admin', password: 'admin123' },
  { username: 'manager', password: 'manager123' },
  { username: 'engineer', password: 'engineer123' },
];

export function Login({ onLogin, onCreateOrganization, isLoading }: LoginProps) {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    // Mock authentication - in real app this would be API call
    const credMatch = userCredentials.find(
      (c) => c.username === credentials.username && c.password === credentials.password,
    );

    if (credMatch) {
      const user = mockUsers.find((u) => u.username === credentials.username);
      if (user && user.isActive) {
        onLogin(user);
      } else {
        setError('User account is inactive. Please contact your administrator.');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock forgot password functionality
    setError('');
    alert('Password reset instructions have been sent to your email.');
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
            <div className="shape shape-5"></div>
          </div>
          <div className="particles">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
            <div className="particle particle-6"></div>
          </div>
          <div className="grid-lines opacity-20"></div>
        </div>

        {/* Forgot Password Card */}
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl shadow-black/20 relative z-10">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center">
              <div className="relative">
                <ImageWithFallback
                  src={gavithLogo}
                  alt="Gavith Build Logo"
                  className="h-16 w-16 object-contain float-animation"
                />
                <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl -z-10"></div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-blue-900 font-bold">Reset Password</CardTitle>
              <p className="gavith-text-gradient mt-2 font-semibold text-lg">Gavith Build</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-username">Username or Email</Label>
                <Input
                  id="reset-username"
                  type="text"
                  placeholder="Enter your username or email"
                  required
                  className="input-enhanced"
                />
              </div>

              <Button type="submit" className="w-full btn-primary-enhanced">
                Send Reset Instructions
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-blue-600 hover:text-blue-700"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
        <div className="particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
        <div className="grid-lines opacity-20"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl shadow-black/20 relative z-10">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex items-center justify-center">
            <div className="relative">
              <ImageWithFallback
                src={gavithLogo}
                alt="Gavith Build Logo"
                className="h-20 w-20 object-contain float-animation"
              />
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl -z-10"></div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="gavith-text-gradient text-4xl font-bold tracking-wide">
              Gavith Build
            </CardTitle>
            <p className="gavith-text-secondary text-lg font-semibold">
              Construction Management System
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                disabled={isLoading}
                required
                className="input-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, password: e.target.value }))
                  }
                  disabled={isLoading}
                  required
                  className="input-enhanced"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                className="px-0 text-blue-600 hover:text-blue-700"
                onClick={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                Forgot password?
              </Button>
            </div>

            <Button type="submit" className="w-full btn-primary-enhanced" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Organization Creation Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">New to Gavith Build?</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                onClick={onCreateOrganization}
                disabled={isLoading}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create New Organization
              </Button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Demo credentials: admin/admin123, manager/manager123, engineer/engineer123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
