'use client';

import {
  Building2,
  User,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Crown,
  Shield,
  Users,
  CreditCard,
} from 'lucide-react';
import React, { useState } from 'react';

import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';
import type { Organization, User as UserType } from '../types';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';

interface OrganizationSetupProps {
  onComplete: (organization: Organization, adminUser: UserType) => void;
  onBack: () => void;
}

export function OrganizationSetup({ onComplete, onBack }: OrganizationSetupProps) {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      icon: Users,
      features: ['Up to 3 projects', 'Basic reporting', 'Email support'],
      badge: null,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$29',
      description: 'Great for small teams',
      icon: Shield,
      features: [
        'Up to 10 projects',
        'Advanced reporting',
        'Priority support',
        'Team collaboration',
      ],
      badge: 'Popular',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$99',
      description: 'Best for growing businesses',
      icon: Crown,
      features: [
        'Unlimited projects',
        'Custom reports',
        '24/7 support',
        'Advanced integrations',
        'API access',
      ],
      badge: 'Recommended',
    },
  ];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !adminName || !adminEmail) return;

    setIsLoading(true);

    // Simulate setup delay
    setTimeout(() => {
      const organization: Organization = {
        id: `org-${Date.now()}`,
        name: orgName,
        isActive: true,
        subscription: selectedPlan as 'free' | 'basic' | 'premium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'setup-wizard',
      };

      const adminUser: UserType = {
        id: `user-${Date.now()}`,
        username: adminEmail.split('@')[0],
        email: adminEmail,
        firstName: adminName.split(' ')[0],
        lastName: adminName.split(' ')[1] || '',
        role: 'admin',
        organizationId: organization.id,
        organizationRole: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onComplete(organization, adminUser);
    }, 2000);
  };

  const canProceedStep1 = orgName.trim().length > 0;
  const canProceedStep2 =
    adminName.trim().length > 0 && adminEmail.trim().length > 0 && adminEmail.includes('@');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ImageWithFallback
              src={gavithLogo}
              alt="Gavith Build Logo"
              className="h-12 w-12 object-contain"
            />
            <h1 className="gavith-text-gradient font-bold text-2xl tracking-tight">Gavith Build</h1>
          </div>
          <p className="text-slate-600">Let&apos;s set up your construction management system</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-slate-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Card */}
        <Card className="enhanced-card shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {step === 1 && <Building2 className="h-6 w-6 text-blue-600" />}
              {step === 2 && <User className="h-6 w-6 text-blue-600" />}
              {step === 3 && <CreditCard className="h-6 w-6 text-blue-600" />}
              {step === 1 && 'Organization Details'}
              {step === 2 && 'Administrator Account'}
              {step === 3 && 'Choose Your Plan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Organization Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-600">Tell us about your organization</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Name
                    </Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter your company or organization name"
                      className="mt-2"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be displayed throughout your dashboard
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceedStep1}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Administrator Account */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-600">Create your administrator account</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adminName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminEmail" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="mt-2"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be your login email and primary contact
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-900">Administrator Privileges</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    As the organization owner, you&apos;ll have full access to all features,
                    settings, and the ability to invite team members.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceedStep2}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Choose Plan */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-600">Choose the plan that fits your needs</p>
                </div>

                <div className="grid gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.badge && (
                        <Badge className="absolute -top-2 left-4 bg-blue-600">{plan.badge}</Badge>
                      )}

                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPlan === plan.id ? 'bg-blue-100' : 'bg-slate-100'
                          }`}
                        >
                          <plan.icon
                            className={`h-6 w-6 ${
                              selectedPlan === plan.id ? 'text-blue-600' : 'text-slate-600'
                            }`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                            <span className="font-bold text-blue-600">{plan.price}</span>
                            {plan.id !== 'free' && (
                              <span className="text-sm text-slate-500">/month</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{plan.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <span key={index} className="text-xs text-slate-500">
                                {feature}
                                {index < 1 ? ' • ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>

                        {selectedPlan === plan.id && (
                          <CheckCircle2 className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Good news!</strong> You can always upgrade or downgrade your plan
                    later from your organization settings.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Setting up...
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>Need help? Contact support at support@gavithbuild.com</p>
        </div>
      </div>
    </div>
  );
}
