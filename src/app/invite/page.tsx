'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [isInitializing, setIsInitializing] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token') ?? searchParams.get('code');

  useEffect(() => {
    let isActive = true;

    async function initializeSession() {
      if (!token) {
        setTokenError('Invitation token is missing. Please request a new invite.');
        setIsInitializing(false);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        if (isActive) {
          setTokenError(
            'This invitation link is invalid or has expired. Please ask for a new invite.',
          );
        }
        setIsInitializing(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (isActive) {
        if (userError || !user?.email) {
          setTokenError('Unable to load your invitation details. Please request a new invite.');
        } else {
          setUserEmail(user.email);
        }
        setIsInitializing(false);
      }
    }

    void initializeSession();

    return () => {
      isActive = false;
    };
  }, [supabase, token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError('');

    if (!password || !confirmPassword) {
      setFormError('Please enter and confirm your password.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setFormError(updateError.message || 'Failed to set password. Please try again.');
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();

    const message = encodeURIComponent('Password set successfully. You can now sign in.');
    router.replace(`/login?message=${message}`);
  };

  const isDisabled = Boolean(tokenError) || isInitializing || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Invite</CardTitle>
          <CardDescription className="text-center">
            Set a password to finish joining your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInitializing ? (
            <p className="text-center text-sm text-muted-foreground">Preparing your account...</p>
          ) : tokenError ? (
            <div className="text-center text-sm text-red-600 space-y-2">
              <p>{tokenError}</p>
              <p>Request a fresh invitation from your administrator and try again.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {userEmail && (
                <div className="text-sm text-center text-muted-foreground">
                  Setting password for{' '}
                  <span className="font-medium text-foreground">{userEmail}</span>
                </div>
              )}

              {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isDisabled}>
                {isSubmitting ? 'Saving password…' : 'Set Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
