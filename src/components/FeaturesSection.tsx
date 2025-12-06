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
import React from 'react';

import AnimatedShaderBackground from './AnimatedShaderBackground';
import DominoesListScroll from './dominoes-scroll';

// Define gradient colors that match the Gavith Build theme
const gradientColors = [
  '#0891b2', // cyan-600
  '#0284c7', // sky-600
  '#0369a1', // sky-700
  '#075985', // sky-800
  '#0c4a6e', // sky-900
  '#164e63', // cyan-800
  '#155e75', // cyan-700
  '#0e7490', // cyan-600
  '#06b6d4', // cyan-500
  '#22d3ee', // cyan-400
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
];

// Define rotations for variety
const rotations = [
  'rotate-3',
  '-rotate-2',
  'rotate-1',
  '-rotate-1',
  'rotate-2',
  '-rotate-3',
  'rotate-0',
  'rotate-1',
  '-rotate-2',
  'rotate-2',
  '-rotate-1',
  'rotate-0',
];

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
  // Transform features data to match DominoesListScroll interface with full card data
  const dominoesItems = features.map((feature, index) => ({
    title: feature.title,
    description: feature.description,
    image: feature.img,
    color: gradientColors[index % gradientColors.length],
    rotation: rotations[index % rotations.length],
    icon: feature.icon,
  }));

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
      }}
    >
      <AnimatedShaderBackground />
      <section className="text-white h-auto py-20 w-full grid place-content-center relative top-0 z-10">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent z-0"></div>

        {/* Decorative squares */}
        <div className="absolute top-10 left-20 w-20 h-20 border-2 border-cyan-400/30 rounded-sm rotate-12"></div>
        <div className="absolute top-16 right-20 w-16 h-16 border-2 border-blue-400/20 rounded-sm -rotate-6"></div>
        <div className="absolute top-20 left-1/3 w-12 h-12 bg-cyan-500/10 rounded-sm rotate-45"></div>

        <h1 className="2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%] relative z-10 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Comprehensive Construction Management
        </h1>

        <p className="text-xl text-center mt-4 text-cyan-100/80 relative z-10">
          Scroll down to explore all 12 powerful features 👇
        </p>
      </section>

      <div className="h-screen w-full relative z-10">
        <DominoesListScroll items={dominoesItems} height={512} width={720} enableShadow={true} />
      </div>
    </div>
  );
}
