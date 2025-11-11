'use client';

import { Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';

interface LoginProps {
  onCreateOrganization: () => void;
}

export function Login({ onCreateOrganization }: LoginProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { login } = useAuth();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const messageParam = searchParams.get('message');
    if (messageParam) {
      setToastMessage(messageParam);
      setShowToast(true);
      setMessage('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showToast) return;
    const timeout = window.setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const { error: loginError } = await login(credentials.email, credentials.password);

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (loginError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in');
        } else {
          setError(loginError.message || 'Failed to sign in. Please try again.');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!credentials.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsResetting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(credentials.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send reset instructions. Please try again.');
        return;
      }

      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError('');
  };

  const openForgotPassword = () => {
    setError('');
    setMessage('');
    setShowForgotPassword(true);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
            <ImageWithFallback
              src={gavithLogo}
              alt="Gavith Build Logo"
              className="h-16 w-16 object-contain mb-6"
            />
            <h2 className="text-3xl font-bold mb-4">Gavith Build</h2>
            <p className="text-blue-100 text-center max-w-md">
              Professional construction management platform for modern teams
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-4 lg:p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4 lg:hidden">
                <ImageWithFallback
                  src={gavithLogo}
                  alt="Gavith Build Logo"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                Reset Password
              </CardTitle>
              <CardDescription>
                Enter your email address and we’ll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {message && !error && (
                  <Alert>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@example.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={isResetting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isResetting}>
                  Send Reset Instructions
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBackToLogin}
                  disabled={isResetting}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {showToast && toastMessage && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
          <div className="max-w-md w-full rounded-lg bg-emerald-500 text-white px-4 py-3 shadow-lg shadow-emerald-500/40">
            <p className="text-sm font-medium text-center">{toastMessage}</p>
          </div>
        </div>
      )}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-white">
          <ImageWithFallback
            src={gavithLogo}
            alt="Gavith Build Logo"
            className="h-20 w-20 object-contain mb-8"
          />
          <h1 className="text-4xl font-bold mb-4 text-center">Gavith Build</h1>
          <p className="text-xl text-blue-100 text-center max-w-md mb-8">
            Professional construction management platform for modern teams
          </p>
          <div className="max-w-md text-center text-blue-100">
            <p className="text-sm">
              Streamline your construction projects with powerful tools for project management,
              materials tracking, and team collaboration.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-4 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2 lg:hidden">
              <ImageWithFallback
                src={gavithLogo}
                alt="Gavith Build Logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              Login to your account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && !error && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={openForgotPassword}
                    disabled={isLoading}
                  >
                    Forgot your password?
                  </Button>
                </div>

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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don’t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCreateOrganization}
                disabled={isLoading}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Create New Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
