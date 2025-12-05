'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import React, { useState } from 'react';

import DominoesListScroll from './dominoes-scroll';
import ScrollCard from './ui/scroll-card';

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
  const [activeIndex, setActiveIndex] = useState(0);

  // Transform features data for DominoesListScroll
  const dominoesItems = features.map((feature) => ({
    image: feature.img,
  }));

  // Handle scroll progress to determine active card
  const handleScrollProgress = (progress: number) => {
    // Calculate which card should be active based on scroll progress
    // Each card becomes active when scroll reaches its position (index / totalItems)
    const totalItems = dominoesItems.length * 2;

    // Find which card is closest to the current scroll position
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < totalItems; i++) {
      const cardPosition = i / totalItems;
      const distance = Math.abs(progress - cardPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    // Map back to original features array (since we duplicate)
    const originalIndex = closestIndex % features.length;
    setActiveIndex(originalIndex);
  };

  const activeFeature = features[activeIndex];

  return (
    <section
      className="relative min-h-screen w-full py-20"
      style={{
        background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
            Features
          </h2>
          <p className="text-xl text-blue-100/80 max-w-2xl mx-auto">
            Powerful tools to manage construction sites, teams, materials, and finances all in one
            place.
          </p>
        </div>

        {/* Main Content: Dominoes on left, Content on right */}
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          {/* Left: Dominoes Scroll */}
          <div className="h-[600px] w-full">
            <DominoesListScroll
              items={[...dominoesItems, ...dominoesItems]}
              enableShadow
              height={500}
              width={384}
              onScrollProgress={handleScrollProgress}
            />
          </div>

          {/* Right: Feature Content */}
          <div className="flex items-center justify-center h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg"
              >
                {/* Icon */}
                <div className="mb-6">
                  {activeFeature.icon && <activeFeature.icon className="h-12 w-12 text-cyan-400" />}
                </div>

                {/* Title */}
                <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {activeFeature.title}
                </h3>

                {/* Description */}
                <p className="text-blue-100/90 text-lg leading-relaxed mb-6">
                  {activeFeature.description}
                </p>

                {/* Feature Number Indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400/70 text-sm font-medium">
                    {activeIndex + 1} of {features.length}
                  </span>
                  <div className="flex-1 h-1 bg-blue-900/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeIndex + 1) / features.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
