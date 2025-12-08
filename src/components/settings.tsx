'use client';

import { User as UserIcon, Shield, Bell, Palette, Lock, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';


import { SectionCard } from './layout/SectionCard';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import { useTheme } from '@/components/theme-provider';

function ThemePreferenceControl() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Theme</p>
        <p className="text-xs text-muted-foreground">
          Current: {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
          {theme === 'system' && ` (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('light')}
          className="h-8"
        >
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="h-8"
        >
          Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('system')}
          className="h-8"
        >
          System
        </Button>
      </div>
    </div>
  );
}

interface UserSettingsProps {
  user?: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    organizationRole?: string;
    companyName: string;
  };
  onUpdateUser?: (
    updates: Partial<{
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    }>,
  ) => Promise<void> | void;
}

export function SettingsPage({ user, onUpdateUser }: UserSettingsProps) {
  // Provide default user if not provided
  const safeUser = user || {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    organizationRole: 'user',
    companyName: '',
  };

  const [profileForm, setProfileForm] = useState({
    username: safeUser.username,
    email: safeUser.email,
    firstName: safeUser.firstName || '',
    lastName: safeUser.lastName || '',
  });

  // Computed full name for display
  const fullName = [safeUser.firstName, safeUser.lastName].filter(Boolean).join(' ') || '';

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (onUpdateUser) {
        await onUpdateUser({
          username: profileForm.username,
          email: profileForm.email,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        });
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const { error } = await response
          .json()
          .catch(() => ({ error: 'Failed to update password' }));
        throw new Error(error || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        // Exclude darkMode from saved preferences (handled by ThemeProvider)
        const { darkMode, ...rest } = parsed;
        setPreferences((prev) => ({ ...prev, ...rest }));
      } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
      }
    }
  }, []);

  const handlePreferencesUpdate = async (key: string, value: string | boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    // Save to localStorage
    try {
      localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

      // Also save to API (optional, for future database storage)
      await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      }).catch(() => {
        // Silently fail if API call fails, localStorage is the primary storage
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <TabsContent value="profile" className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <SectionCard title="Profile Information">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-border">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {fullName
                          ? fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : safeUser.username.slice(0, 2).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {fullName || safeUser.username || 'User'}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {safeUser.organizationRole || safeUser.role}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {safeUser.companyName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-foreground">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={profileForm.username}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, username: e.target.value }))
                        }
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {fullName && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullNameDisplay"
                        className="text-sm font-medium text-foreground"
                      >
                        Full Name
                      </Label>
                      <Input id="fullNameDisplay" value={fullName} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        Computed from First Name and Last Name
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-foreground">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={safeUser.companyName}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Company cannot be changed</p>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <SectionCard title="Security Settings">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium text-foreground"
                      >
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                        required
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        required
                        placeholder="Enter your new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-foreground"
                      >
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        required
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 px-6"
                      disabled={isUpdatingPassword}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <SectionCard title="Notification Settings">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        handlePreferencesUpdate('emailNotifications', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) =>
                        handlePreferencesUpdate('pushNotifications', checked)
                      }
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <SectionCard title="Application Preferences">
                <div className="space-y-6">
                  <ThemePreferenceControl />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium text-foreground">
                        Language
                      </Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => handlePreferencesUpdate('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="mr">Marathi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-sm font-medium text-foreground">
                        Timezone
                      </Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => handlePreferencesUpdate('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                          <SelectItem value="Asia/Mumbai">Asia/Mumbai</SelectItem>
                          <SelectItem value="Asia/Delhi">Asia/Delhi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
