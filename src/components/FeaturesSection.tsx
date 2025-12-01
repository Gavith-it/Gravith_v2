'use client';

import {
  Building2,
  UserCheck,
  Package,
  Truck,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import Stack component with SSR disabled to prevent hydration mismatches
const Stack = dynamic(() => import('./Stack'), {
  ssr: false,
  loading: () => (
    <div className="relative flex items-center justify-center" style={{ width: 400, height: 500 }}>
      <div className="text-cyan-100/60">Loading...</div>
    </div>
  ),
});

const features = [
  {
    id: 1,
    icon: Building2,
    title: 'Site Management',
    description:
      'Manage multiple construction sites with real time progress tracking and resource allocation',
    img: 'https://images.unsplash.com/photo-1625470496744-a01bf36a262f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwbWFuYWdlbWVudHxlbnwxfHx8fDE3NjQ1NTEyMzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 2,
    icon: UserCheck,
    title: 'Labour Tracking',
    description:
      'Track individual workers with attendance, skills, payments, and performance metrics',
    img: 'https://images.unsplash.com/photo-1612725118809-0bebfb71a551?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBoZWxtZXR8ZW58MXx8fHwxNzY0NTAxNzc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 3,
    icon: Package,
    title: 'Material Inventory',
    description: 'Advanced inventory control with analytics, stock alerts, and supplier management',
    img: 'https://images.unsplash.com/photo-1761805618757-9d2b9552ee32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMG1hdGVyaWFscyUyMHdhcmVob3VzZXxlbnwxfHx8fDE3NjQ1NjQ4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 4,
    icon: Truck,
    title: 'Vehicle & Equipment',
    description:
      'Complete fleet management with maintenance tracking, fuel monitoring, and utilization reports',
    img: 'https://images.unsplash.com/photo-1649034872337-feaa751786ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBleGNhdmF0b3IlMjBtYWNoaW5lcnl8ZW58MXx8fHwxNzY0NTcyMjEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 5,
    icon: DollarSign,
    title: 'Expense Management',
    description: 'Track all expenses, budgets, and payments with detailed financial analytics',
    img: 'https://images.unsplash.com/photo-1711344397160-b23d5deaa012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBidWRnZXQlMjBjYWxjdWxhdG9yfGVufDF8fHx8MTc2NDU3MjIxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 6,
    icon: Users,
    title: 'Vendor Management',
    description: 'Manage suppliers, track deliveries, and maintain vendor performance records',
    img: 'https://images.unsplash.com/photo-1758599543152-a73184816eba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kc2hha2UlMjBidXNpbmVzcyUyMHBhcnRuZXJzaGlwfGVufDF8fHx8MTc2NDU3MjIxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 7,
    icon: Calendar,
    title: 'Project Scheduling',
    description: 'Plan and track project timelines with Gantt charts and milestone tracking',
    img: 'https://images.unsplash.com/photo-1721132537184-5494c01ed87f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3QlMjBibHVlcHJpbnRzJTIwcGxhbm5pbmd8ZW58MXx8fHwxNzY0NTcyMjEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 8,
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive dashboards and automated reports for data driven decisions',
    img: 'https://images.unsplash.com/photo-1738996747326-65b5d7d7fe9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwZ3JhcGhzfGVufDF8fHx8MTc2NDU3MjIxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 9,
    icon: FileText,
    title: 'Payment Tracking',
    description: 'Monitor payments to vendors, suppliers, and workers with automated reminders',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVkaXQlMjBjYXJkJTIwcGF5bWVudHxlbnwxfHx8fDE3NjQ1MjI5MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 10,
    icon: Settings,
    title: 'Budget Management',
    description: 'Set and track budgets across projects with variance analysis and forecasting',
    img: 'https://images.unsplash.com/photo-1724781189475-a332f44de593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxjdWxhdG9yJTIwbW9uZXklMjBidWRnZXR8ZW58MXx8fHwxNzY0NTcyMjE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 11,
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Enterprise grade security with role based access and complete audit trails',
    img: 'https://images.unsplash.com/photo-1758983308742-f4ba1f8c8cb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnNlY3VyaXR5JTIwZGlnaXRhbCUyMGxvY2t8ZW58MXx8fHwxNzY0NTcyMjE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 12,
    icon: TrendingUp,
    title: 'Business Intelligence',
    description: 'AI powered insights and predictive analytics for optimized operations',
    img: 'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGdyb3d0aCUyMGNoYXJ0fGVufDF8fHx8MTc2NDUxODA5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative pt-4 pb-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-4">
        {/* Header */}
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
            Features
          </h2>
          <p className="text-center text-2xl leading-relaxed text-cyan-100/80 max-w-[700px] mb-4">
            Powerful tools to manage construction sites, teams, materials, and finances all in one
            place.
          </p>
          <p className="text-center text-lg text-cyan-200/60 italic">
            Drag cards to explore • Click to reorder
          </p>
        </div>

        {/* Stack Component */}
        <div className="flex justify-center items-center min-h-[600px]">
          <Stack
            randomRotation={true}
            sensitivity={150}
            sendToBackOnClick={true}
            cardDimensions={{ width: 400, height: 500 }}
            cardsData={features}
          />
        </div>
      </div>
    </section>
  );
}
