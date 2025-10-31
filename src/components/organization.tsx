'use client';

import {
  Settings,
  Users,
  CreditCard,
  Shield,
  Building2,
  Calendar,
  Crown,
  User,
  UserCheck,
} from 'lucide-react';
import React, { useState } from 'react';

import { formatDate } from '../lib/utils';
import type { UserWithOrganization, Organization } from '../types';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface OrganizationManagementProps {
  currentUser: UserWithOrganization;
  currentOrganization: Organization;
  onUpdateOrganization: (updates: Partial<Organization>) => void;
}

export function OrganizationPage({
  currentUser,
  currentOrganization,
  onUpdateOrganization,
}: OrganizationManagementProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentOrganization.name);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== currentOrganization.name) {
      onUpdateOrganization({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(currentOrganization.name);
    setIsEditingName(false);
  };

  const getSubscriptionBadgeVariant = (subscription: string) => {
    switch (subscription) {
      case 'enterprise':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'manager':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'manager':
        return UserCheck;
      default:
        return User;
    }
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <TabsContent value="overview" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization Details */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Organization Name</Label>
                    {isEditingName ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1"
                          placeholder="Organization name"
                        />
                        <Button size="sm" onClick={handleSaveName}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{currentOrganization.name}</p>
                        {(currentUser.organizationRole === 'owner' ||
                          currentUser.organizationRole === 'admin') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditingName(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Subscription Plan</Label>
                    <div className="mt-2">
                      <Badge
                        variant={getSubscriptionBadgeVariant(
                          currentOrganization.subscription || 'free',
                        )}
                        className="capitalize"
                      >
                        {currentOrganization.subscription || 'Free'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Status</Label>
                    <div className="mt-2">
                      <Badge variant={currentOrganization.isActive ? 'default' : 'destructive'}>
                        {currentOrganization.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Created</Label>
                    <div className="mt-2 flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(currentOrganization.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Role */}
              <Card className="enhanced-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(getRoleIcon(currentUser.organizationRole), {
                      className: 'h-5 w-5 text-blue-600',
                    })}
                    Your Role & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Role</Label>
                    <div className="mt-2">
                      <Badge
                        variant={getRoleBadgeVariant(currentUser.organizationRole)}
                        className="capitalize"
                      >
                        {currentUser.organizationRole}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Email</Label>
                    <p className="mt-2 text-slate-900">{currentUser.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Member Since</Label>
                    <div className="mt-2 flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(currentUser.createdAt)}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Permissions</Label>
                    <div className="mt-2 space-y-1">
                      {currentUser.organizationRole === 'owner' && (
                        <div className="text-sm text-slate-600">• Full organization access</div>
                      )}
                      {(currentUser.organizationRole === 'owner' ||
                        currentUser.organizationRole === 'admin') && (
                        <>
                          <div className="text-sm text-slate-600">
                            • Manage organization settings
                          </div>
                          <div className="text-sm text-slate-600">• Invite and manage members</div>
                        </>
                      )}
                      <div className="text-sm text-slate-600">• Access all projects and data</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Organization Members
                  </CardTitle>
                  {(currentUser.organizationRole === 'owner' ||
                    currentUser.organizationRole === 'admin') && <Button>Invite Member</Button>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current user */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {(currentUser.firstName?.[0] || currentUser.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {currentUser.firstName && currentUser.lastName
                            ? `${currentUser.firstName} ${currentUser.lastName}`
                            : currentUser.username}{' '}
                          <span className="text-blue-600">(You)</span>
                        </p>
                        <p className="text-sm text-slate-600">{currentUser.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={getRoleBadgeVariant(currentUser.organizationRole)}
                      className="capitalize"
                    >
                      {currentUser.organizationRole}
                    </Badge>
                  </div>

                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No other members yet</p>
                    <p className="text-sm mt-1">Invite team members to collaborate on projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Subscription & Billing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 capitalize">
                          {currentOrganization.subscription || 'Free'} Plan
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Current subscription plan for your organization
                        </p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </div>

                  <div className="text-center py-8 text-slate-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Billing management coming soon</p>
                    <p className="text-sm mt-1">
                      Advanced subscription features will be available in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <Card className="enhanced-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Organization Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8 text-slate-500">
                    <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Advanced settings coming soon</p>
                    <p className="text-sm mt-1">
                      Additional organization configuration options will be available in future
                      updates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
