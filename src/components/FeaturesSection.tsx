'use client';

import {
  Building2,
  Users,
  Package,
  Truck,
  DollarSign,
  UserCheck,
  Calendar,
  BarChart3,
  Receipt,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: Building2,
      title: 'Site Management',
      description:
        'Manage multiple construction sites with real time progress tracking and resource allocation',
      color: 'rgba(6, 182, 212, 0.15)',
    },
    {
      icon: Users,
      title: 'Labour Tracking',
      description:
        'Track individual workers with attendance, skills, payments, and performance metrics',
      color: 'rgba(59, 130, 246, 0.15)',
    },
    {
      icon: Package,
      title: 'Material Inventory',
      description:
        'Advanced inventory control with analytics, stock alerts, and supplier management',
      color: 'rgba(139, 92, 246, 0.15)',
    },
    {
      icon: Truck,
      title: 'Vehicle & Equipment',
      description:
        'Complete fleet management with maintenance tracking, fuel monitoring, and utilization reports',
      color: 'rgba(236, 72, 153, 0.15)',
    },
    {
      icon: DollarSign,
      title: 'Expense Management',
      description: 'Track all expenses, budgets, and payments with detailed financial analytics',
      color: 'rgba(249, 115, 22, 0.15)',
    },
    {
      icon: UserCheck,
      title: 'Vendor Management',
      description: 'Manage suppliers, track deliveries, and maintain vendor performance records',
      color: 'rgba(34, 197, 94, 0.15)',
    },
    {
      icon: Calendar,
      title: 'Project Scheduling',
      description: 'Plan and track project timelines with Gantt charts and milestone tracking',
      color: 'rgba(168, 85, 247, 0.15)',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Comprehensive dashboards and automated reports for data driven decisions',
      color: 'rgba(14, 165, 233, 0.15)',
    },
    {
      icon: Receipt,
      title: 'Payment Tracking',
      description: 'Monitor payments to vendors, suppliers, and workers with automated reminders',
      color: 'rgba(59, 130, 246, 0.15)',
    },
    {
      icon: Settings,
      title: 'Budget Management',
      description: 'Set and track budgets across projects with variance analysis and forecasting',
      color: 'rgba(6, 182, 212, 0.15)',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise grade security with role based access and complete audit trails',
      color: 'rgba(139, 92, 246, 0.15)',
    },
    {
      icon: TrendingUp,
      title: 'Business Intelligence',
      description: 'AI powered insights and predictive analytics for optimized operations',
      color: 'rgba(236, 72, 153, 0.15)',
    },
  ];

  return (
    <section
      id="features"
      className="relative py-24"
      style={{
        background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>

      {/* Section Header */}
      <div className="relative z-10 text-center mb-16">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Features</h2>
        <p className="text-xl text-blue-100/80 max-w-3xl mx-auto px-4">
          Powerful tools to manage construction sites, teams, materials, and finances all in one
          place.
        </p>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={`feature-${feature.title}-${i}`}
                className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-cyan-400/30 backdrop-blur-md rounded-[40px] p-12 shadow-[0_0_30px_rgba(0,0,0,0.1)] hover:border-cyan-400/50 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-2xl flex items-center justify-center border border-cyan-400/40 mb-6">
                  <Icon className="h-10 w-10 text-cyan-300" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-lg text-blue-100/90 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
