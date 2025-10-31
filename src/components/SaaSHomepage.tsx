'use client';

import {
  Check,
  Building2,
  Users,
  Shield,
  TrendingUp,
  Zap,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Package,
  Eye,
  MessageSquare,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import featuresImage from '../assets/06a706809a776ef95a726ac4de261e17620abf0b.png';
import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';

import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface SaaSHomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Deterministic PRNG to avoid SSR/CSR hydration mismatches
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function createParticleLayout(count: number, seed: number) {
  const rand = mulberry32(seed);
  const particles = Array.from({ length: count }, () => {
    const left = `${rand() * 100}%`;
    const top = `${rand() * 100}%`;
    const animationDelay = `${rand() * 8}s`;
    return { left, top, animationDelay };
  });
  return particles;
}

export function SaaSHomepage({ onGetStarted, onLogin }: SaaSHomepageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  const [currentFloor, setCurrentFloor] = useState(0);

  // Generate a stable particle layout for both server and client renders
  const particles = useMemo(() => createParticleLayout(12, 1337), []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current && contentRef.current) {
        const scrolled = window.pageYOffset;
        const heroHeight = heroRef.current.offsetHeight;
        const scrollProgress = Math.min(scrolled / (heroHeight * 0.8), 1);

        // Enhanced building entrance effect - dramatic zoom and depth
        const scaleValue = 1 + scrollProgress * 2.5;
        const translateY = scrollProgress * -200;
        const brightness = Math.max(0.05, 1 - scrollProgress * 0.95);
        const blur = scrollProgress * 6;
        const contrast = Math.max(0.8, 1 - scrollProgress * 0.3);

        heroRef.current.style.transform = `scale(${scaleValue}) translateY(${translateY}px)`;
        heroRef.current.style.filter = `brightness(${brightness}) blur(${blur}px) contrast(${contrast})`;

        // Interior content emerges dramatically
        const contentOpacity = Math.min(1, Math.max(0.3, (scrollProgress - 0.05) * 3));
        const contentTransform = Math.max(-60, -60 + scrollProgress * 80);

        contentRef.current.style.transform = `translateY(${contentTransform}px)`;
        contentRef.current.style.opacity = `${contentOpacity}`;

        // Progressive section reveals with floor-by-floor progression
        const windowHeight = window.innerHeight;
        const sections = sectionsRef.current;

        sections.forEach((section, index) => {
          if (section) {
            const rect = section.getBoundingClientRect();
            const isVisible = rect.top < windowHeight * 0.8 && rect.bottom > 0;
            const visibilityProgress = Math.max(
              0,
              Math.min(1, (windowHeight * 0.8 - rect.top) / (windowHeight * 0.6)),
            );

            if (isVisible && visibilityProgress > 0.1) {
              setCurrentFloor(index + 1);

              // Staggered content animation within each section
              const items = section.querySelectorAll('.floor-content-item');
              items.forEach((item, itemIndex) => {
                const delay = itemIndex * 150;
                setTimeout(() => {
                  (item as HTMLElement).style.animation =
                    `floor-content-enter 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
                  (item as HTMLElement).style.opacity = '1';
                  (item as HTMLElement).style.transform = 'translateX(0) translateY(0)';
                }, delay);
              });
            }
          }
        });

        // Enhanced sequential animation trigger
        if (scrollProgress > 0.05) {
          const sequentialItems = contentRef.current.querySelectorAll('.entrance-animation');
          sequentialItems.forEach((item, index) => {
            const itemProgress = Math.max(0, (scrollProgress - 0.05 - index * 0.02) * 4);
            if (itemProgress > 0) {
              (item as HTMLElement).style.animation =
                `entrance-emerge 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
              (item as HTMLElement).style.animationDelay = `${index * 0.1}s`;
              (item as HTMLElement).style.opacity = '1';
              (item as HTMLElement).style.transform = 'translateX(0) translateY(0)';
            }
          });
        }
      }
    };

    // Enhanced content visibility on load
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.opacity = '1';
        contentRef.current.style.transform = 'translateY(0px)';

        const allItems = contentRef.current.querySelectorAll(
          '.entrance-animation, .floor-content-item',
        );
        allItems.forEach((item) => {
          (item as HTMLElement).style.opacity = '1';
          (item as HTMLElement).style.transform = 'translateX(0) translateY(0)';
        });
      }
    }, 200);

    // Enhanced scroll handling with throttling
    let ticking = false;
    const optimizedHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    optimizedHandleScroll();
    window.addEventListener('scroll', optimizedHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', optimizedHandleScroll);
  }, []);

  const features = [
    {
      icon: Building2,
      title: 'Site Management',
      description:
        'Complete project oversight with real-time tracking and resource allocation across multiple construction sites',
    },
    {
      icon: UserCheck,
      title: 'Workforce Management',
      description:
        'Comprehensive employee tracking, attendance monitoring, skill management, and performance analytics for your construction teams',
    },
    {
      icon: Package,
      title: 'Materials Management',
      description:
        'Advanced inventory control, supplier management, cost tracking, and automated reordering for construction materials',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Seamless coordination between site managers, workers, and stakeholders with real-time communication tools',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Reports',
      description:
        'Comprehensive insights with automated reporting, data visualization, and predictive analytics for better decision making',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description:
        'Enterprise-grade security with industry compliance standards, data encryption, and audit trails',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      company: 'Kumar Construction Ltd.',
      role: 'Project Director',
      content:
        'Gavith Build has revolutionized how we manage our construction projects. The integrated approach saves us hours every day.',
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      company: 'Metro Infrastructure',
      role: 'Operations Manager',
      content:
        'The vehicle tracking and expense management features have improved our operational efficiency by 40%.',
      rating: 5,
    },
    {
      name: 'Amit Patel',
      company: 'Patel Builders',
      role: 'CEO',
      content:
        'Finally, a construction management system built by people who understand the industry. Highly recommended!',
      rating: 5,
    },
  ];

  const pricingFeatures = [
    'Unlimited Sites & Projects',
    'Vehicle & Equipment Tracking',
    'Material Inventory Management',
    'Expense Management',
    'Vendor Management',
    'Real-time Analytics',
    'Mobile Access',
    '24/7 Support',
    'Data Backup & Security',
    'Custom Reports',
    'Multi-user Collaboration',
    'API Integration',
  ];

  const floorAreas = [
    {
      id: 'lobby',
      title: 'Grand Glass Atrium',
      subtitle: 'Premium Welcome Center',
      description: 'Step into our stunning glass atrium where innovation meets transparency',
      bgImage: featuresImage,
    },
    {
      id: 'lounge',
      title: 'Glass Executive Lounge',
      subtitle: 'Enterprise Solutions',
      description: 'Experience premium solutions in our transparent boardroom environment',
      bgImage:
        'https://images.unsplash.com/photo-1551785205-9e39b11da77f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJ1aWxkaW5nJTIwaW50ZXJpb3IlMjBibHVlJTIwbGlnaHRpbmd8ZW58MXx8fHwxNzU3NDg5OTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'conference',
      title: 'Crystal Conference Center',
      subtitle: 'Client Success Stories',
      description: 'Witness success stories in our state-of-the-art glass meeting space',
      bgImage:
        'https://images.unsplash.com/photo-1625748356952-c92bd499416b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY3VsdXMlMjBueWMlMjBnbGFzcyUyMGludGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc1NzQ4OTkxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
    {
      id: 'workspace',
      title: 'Transparent Innovation Hub',
      subtitle: 'Strategic Partnership',
      description: 'Collaborate with our experts in our open glass workspace environment',
      bgImage:
        'https://images.unsplash.com/photo-1694273144011-455055905f83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBnbGFzcyUyMHdvcmtzcGFjZSUyMGludGVyaW9yfGVufDF8fHx8MTc1NzQ4OTkzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Enhanced Header with Logo Theme and Floor Indicator */}
      <header className="bg-gradient-to-r from-cyan-500/90 via-blue-600/90 to-blue-700/90 backdrop-blur-xl border-b border-cyan-400/20 sticky top-0 z-50 shadow-2xl shadow-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ImageWithFallback
                src={gavithLogo}
                alt="Gavith Build Logo"
                className="h-10 w-10 object-contain float-animation"
                width={40}
                height={40}
                sizes="40px"
              />
              <div>
                <h1 className="text-white font-bold text-lg drop-shadow-lg">Gavith Build</h1>
                <p className="text-cyan-100 text-xs font-medium">Construction Management System</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#lobby"
                className="text-cyan-100 hover:text-white text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="#lounge"
                className="text-cyan-100 hover:text-white text-sm font-medium transition-colors"
              >
                Pricing
              </a>
              <a
                href="#conference"
                className="text-cyan-100 hover:text-white text-sm font-medium transition-colors"
              >
                Testimonials
              </a>
              <a
                href="#workspace"
                className="text-cyan-100 hover:text-white text-sm font-medium transition-colors"
              >
                Contact
              </a>
            </nav>

            {/* Floor Indicator */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-white/10 border border-cyan-300/30 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                <span className="text-cyan-100 text-sm font-medium">
                  Floor {currentFloor} / {floorAreas.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-cyan-100 hover:text-white hover:bg-white/10 border border-cyan-300/20"
                onClick={onLogin}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-white to-cyan-50 text-blue-700 hover:from-cyan-50 hover:to-white font-semibold px-6 shadow-lg shadow-cyan-500/30 border-0 futuristic-button"
                onClick={onGetStarted}
              >
                Enter Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cinematic Building Entrance - Exterior View */}
      <section className="relative min-h-[140vh] overflow-hidden">
        <div
          ref={heroRef}
          className="absolute inset-0 w-full h-full hero-parallax"
          style={{ transformOrigin: 'center center' }}
        >
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1639484800974-73482b1f0814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnbGFzcyUyMGJ1aWxkaW5nJTIwZXh0ZXJpb3IlMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzU2NDY1MzE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Modern Construction Building Exterior"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
            sizes="100vw"
            priority
          />

          {/* Cinematic entrance overlays with logo theme colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-cyan-900/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/60 to-blue-900/60"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80"></div>

          {/* Depth and perspective effects */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-900/20 to-slate-900/60"></div>

          {/* Animated particles for depth */}
          <div className="absolute inset-0 particles">
            {particles.map((p, i) => (
              <div
                key={i}
                className={`particle particle-${i + 1}`}
                style={{ left: p.left, top: p.top, animationDelay: p.animationDelay }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content with Enhanced Typography */}
        <div className="absolute inset-0 flex items-center justify-center text-center z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 border-cyan-400/30 mb-8 backdrop-blur-sm pulse-glow text-lg px-4 py-2">
              <Zap className="h-4 w-4" />
              Trusted by 500+ Construction Companies Worldwide
            </Badge>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight futuristic-text">
              <span className="gavith-text-gradient block mb-2">Gavith Build</span>
              <span className="text-white/90 text-4xl md:text-5xl lg:text-6xl block">
                Next-Generation Construction Management
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-100/90 mb-12 max-w-4xl mx-auto leading-relaxed">
              Step into the future of construction management. Experience AI-powered insights,
              real-time collaboration, and intelligent automation that transforms how you build.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-lg px-12 py-4 font-semibold shadow-2xl shadow-cyan-500/40 border-0 futuristic-button pulse-glow"
                onClick={onGetStarted}
              >
                Enter the Building
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/5 border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-400/50 text-lg px-8 py-4 backdrop-blur-sm"
                onClick={onLogin}
              >
                <Eye className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-cyan-300 text-sm font-medium">Scroll to Enter</span>
            <div className="w-6 h-12 border-2 border-cyan-400/60 rounded-full flex justify-center backdrop-blur-sm bg-cyan-500/10 scroll-indicator">
              <div className="w-1.5 h-4 bg-cyan-300 rounded-full mt-2 shadow-lg shadow-cyan-300/50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Building Interior - Progressive Floor Experience */}
      <section className="relative bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
        {/* Interior content that emerges from building entrance */}
        <div
          ref={contentRef}
          className="relative z-20 building-interior-content"
          style={{ opacity: 1, transform: 'translateY(0px)' }}
        >
          {/* Stats Section - Building Entrance */}
          <section className="py-20 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-sm entrance-animation">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
                <div className="text-center entrance-animation">
                  <div className="text-5xl font-bold gavith-text-gradient mb-3">2,500+</div>
                  <div className="text-cyan-100 text-lg">Enterprise Projects</div>
                </div>
                <div className="text-center entrance-animation">
                  <div className="text-5xl font-bold gavith-text-gradient mb-3">99.99%</div>
                  <div className="text-cyan-100 text-lg">Platinum SLA</div>
                </div>
                <div className="text-center entrance-animation">
                  <div className="text-5xl font-bold gavith-text-gradient mb-3">24/7</div>
                  <div className="text-cyan-100 text-lg">Concierge Support</div>
                </div>
              </div>
            </div>
          </section>

          {/* Floor 1: Reception Lobby - Features */}
          <div
            id="lobby"
            ref={(el) => {
              if (el) sectionsRef.current[0] = el;
            }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Grand Glass Atrium Background */}
            <div className="absolute inset-0 z-0">
              <ImageWithFallback
                src={floorAreas[0].bgImage}
                alt="Modern Glass Building Interior"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-cyan-900/60 to-slate-900/50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-transparent to-cyan-900/30"></div>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Reception Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
              <div className="text-center mb-20 floor-content-item opacity-0 transform translate-y-[30px]">
                <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border-cyan-400/30 mb-8 backdrop-blur-sm text-lg px-6 py-3 shadow-lg shadow-cyan-500/20">
                  <Building2 className="h-5 w-5" />
                  {floorAreas[0].subtitle}
                </Badge>
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 gavith-text-gradient drop-shadow-2xl">
                  Enterprise-Grade Construction Management
                </h2>
                <p className="text-xl text-cyan-100/90 max-w-5xl mx-auto leading-relaxed">
                  Welcome to the pinnacle of construction management excellence. Our comprehensive
                  suite of premium tools transforms how elite construction companies operate,
                  delivering unprecedented efficiency and control across every project phase.
                </p>
              </div>

              <div className="floor-content-item opacity-0 transform translate-y-[30px]">
                <Card className="bg-white/10 backdrop-blur-xl border border-cyan-500/30 feature-card-glow relative overflow-hidden">
                  <CardContent className="p-12">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-2xl flex items-center justify-center border border-cyan-400/40 flex-shrink-0 shadow-lg shadow-cyan-500/20">
                            <feature.icon className="h-8 w-8 text-cyan-300" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-cyan-100/90 leading-relaxed text-lg">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Floor 2: Executive Lounge - Pricing */}
          <div
            id="lounge"
            ref={(el) => {
              if (el) sectionsRef.current[1] = el;
            }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Glass Executive Lounge Background */}
            <div className="absolute inset-0 z-0">
              <ImageWithFallback
                src={floorAreas[1].bgImage}
                alt="Glass Executive Lounge"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-cyan-900/60 to-slate-900/50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-blue-900/35 via-transparent to-cyan-900/35"></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Lounge Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
              <div className="text-center mb-20 floor-content-item opacity-0 transform translate-y-[30px]">
                <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-400/30 mb-8 backdrop-blur-sm text-lg px-6 py-3 shadow-lg shadow-blue-500/20">
                  <TrendingUp className="h-5 w-5" />
                  {floorAreas[1].subtitle}
                </Badge>
                <h2 className="text-5xl font-bold text-white mb-8 gavith-text-gradient drop-shadow-2xl">
                  Platinum-Tier Investment Plans
                </h2>
                <p className="text-xl text-blue-100/90 leading-relaxed max-w-5xl mx-auto">
                  Experience enterprise-grade construction management with transparent, scalable
                  pricing designed for industry leaders. No hidden complexities - just premium
                  solutions that grow with your empire.
                </p>
              </div>

              <div className="floor-content-item opacity-0 transform translate-y-[30px]">
                <Card className="bg-white/5 backdrop-blur-xl border border-blue-500/20 pricing-card-glow relative overflow-hidden">
                  <CardHeader className="text-center p-8 pt-12">
                    <CardTitle className="text-3xl font-bold text-white mb-2">
                      Professional Plan
                    </CardTitle>
                    <CardDescription className="text-blue-100/70 mb-6 text-lg">
                      Perfect for construction companies of all sizes
                    </CardDescription>

                    <div className="text-center mb-8">
                      <div className="text-6xl font-bold gavith-text-gradient mb-2">
                        ₹500
                        <span className="text-lg text-blue-200/70 font-normal">/user/month</span>
                      </div>
                      <p className="text-blue-200/70">
                        + One-time setup:{' '}
                        <span className="font-semibold text-cyan-400">₹25,000</span>
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-8 pt-0">
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-6 mb-8 border border-cyan-500/20">
                      <h4 className="font-semibold text-white mb-4">Setup includes:</h4>
                      <ul className="text-sm text-blue-100/80 space-y-3">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Complete system configuration
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Data migration assistance
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Team training sessions (2 hours)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-cyan-400" />
                          Custom workflow setup
                        </li>
                      </ul>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h4 className="font-semibold text-white mb-4">Core Features:</h4>
                        <ul className="space-y-3">
                          {pricingFeatures.slice(0, 6).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-blue-100/80 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-4">Advanced Features:</h4>
                        <ul className="space-y-3">
                          {pricingFeatures.slice(6).map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              <span className="text-blue-100/80 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-lg py-4 font-semibold shadow-lg shadow-cyan-500/30 border-0 futuristic-button"
                      onClick={onGetStarted}
                    >
                      Start 30-Day Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-sm text-blue-200/60 mt-3 text-center">
                      No credit card required • Cancel anytime
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Floor 3: Glass Conference Center - Testimonials */}
          <div
            id="conference"
            ref={(el) => {
              if (el) sectionsRef.current[2] = el;
            }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Crystal Conference Center Background */}
            <div className="absolute inset-0 z-0">
              <ImageWithFallback
                src={floorAreas[2].bgImage}
                alt="Crystal Glass Conference Center"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/60 to-cyan-900/50"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/35 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/25 via-transparent to-cyan-900/25"></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Conference Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
              <div className="text-center mb-20 floor-content-item opacity-0 transform translate-y-[30px]">
                <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-500/20 to-cyan-500/20 text-slate-200 border-slate-400/30 mb-8 backdrop-blur-sm text-lg px-6 py-3 shadow-lg shadow-slate-500/20">
                  <Star className="h-5 w-5" />
                  {floorAreas[2].subtitle}
                </Badge>
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 gavith-text-gradient drop-shadow-2xl">
                  Elite Industry Partnerships
                </h2>
                <p className="text-xl text-slate-200/90 max-w-5xl mx-auto leading-relaxed">
                  Discover how Fortune 500 construction enterprises and industry titans have
                  revolutionized their operations through our premium platform. Their success
                  stories define the new standard of construction excellence.
                </p>
              </div>

              <div className="floor-content-item opacity-0 transform translate-y-[30px]">
                <Card className="bg-white/10 backdrop-blur-xl border border-slate-500/30 testimonial-card-glow relative overflow-hidden mb-16">
                  <CardContent className="p-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                      {testimonials.map((testimonial, index) => (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-6">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-cyan-400 text-cyan-400" />
                            ))}
                          </div>
                          <p className="text-slate-200/90 mb-8 leading-relaxed text-lg italic">
                            &quot;{testimonial.content}&quot;
                          </p>
                          <div className="border-t border-slate-500/30 pt-6">
                            <div className="font-bold text-white text-xl">{testimonial.name}</div>
                            <div className="text-slate-300/80 mt-1">{testimonial.role}</div>
                            <div className="gavith-text-gradient font-medium mt-2">
                              {testimonial.company}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Floor 4: Modern Workspace - Contact */}
          <div
            id="workspace"
            ref={(el) => {
              if (el) sectionsRef.current[3] = el;
            }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Transparent Innovation Hub Background */}
            <div className="absolute inset-0 z-0">
              <ImageWithFallback
                src={floorAreas[3].bgImage}
                alt="Transparent Glass Innovation Hub"
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/70 via-blue-900/60 to-slate-900/50 contact-bg-animated"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/45 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/35 via-transparent to-blue-900/35"></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Workspace Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
              <div className="text-center mb-20 floor-content-item opacity-0 transform translate-y-[30px]">
                <Badge className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border-cyan-400/30 mb-8 backdrop-blur-sm text-lg px-6 py-3 shadow-lg shadow-cyan-500/20">
                  <Zap className="h-5 w-5" />
                  {floorAreas[3].subtitle}
                </Badge>
                <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 gavith-text-gradient drop-shadow-2xl">
                  Your Construction Empire Awaits
                </h2>
                <p className="text-xl text-cyan-100/90 max-w-5xl mx-auto leading-relaxed">
                  Step into the future of construction leadership. Our dedicated partnership team is
                  ready to architect your organization&apos;s transformation. Connect with industry
                  experts who understand the complexities of large-scale construction operations.
                </p>
              </div>

              <div className="max-w-5xl mx-auto space-y-16">
                {/* Professional Business Card */}
                <div className="floor-content-item opacity-0 transform translate-y-[50px]">
                  <h3 className="text-4xl font-bold text-white mb-12 text-center">
                    Connect With Our Team
                  </h3>

                  {/* Rectangular Business Card Design */}
                  <div className="relative max-w-2xl mx-auto">
                    {/* Standard Business Card Dimensions Ratio (3.5:2) */}
                    <div className="bg-gradient-to-br from-white/95 to-slate-50/90 backdrop-blur-sm rounded-xl p-8 border border-slate-200/30 shadow-2xl hover:shadow-3xl transition-all duration-500 business-card-glow aspect-[7/4] flex">
                      {/* Left Side - Logo and Company Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Company Logo and Name */}
                          <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                              <ImageWithFallback
                                src={gavithLogo}
                                alt="Gavith Build Logo"
                                className="h-16 w-16 object-contain"
                                width={64}
                                height={64}
                                sizes="64px"
                              />
                            </div>
                            <div>
                              <h4 className="text-2xl font-bold gavith-text-gradient">
                                Gavith Build
                              </h4>
                              <p className="text-slate-600 font-medium text-sm">
                                Construction Management System
                              </p>
                            </div>
                          </div>

                          {/* Tagline */}
                          <div className="mb-4">
                            <p className="text-slate-700 font-medium text-base italic">
                              &quot;Building Excellence Through Innovation&quot;
                            </p>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <p className="text-slate-600 text-sm font-medium">
                            Site Management • Vehicle Tracking • Material Control
                          </p>
                        </div>
                      </div>

                      {/* Vertical Divider */}
                      <div className="w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-8"></div>

                      {/* Right Side - Contact Information */}
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        {/* Contact Header */}
                        <div className="mb-2">
                          <h5 className="text-slate-800 font-bold text-lg">Get In Touch</h5>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                          <div className="text-slate-700 font-medium text-sm">
                            partnerships@gavithbuild.com
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="text-slate-700 font-medium text-sm">+91 98765 43210</div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                          <div className="text-slate-700 font-medium text-sm leading-relaxed">
                            Bangalore Financial District
                            <br />
                            Karnataka, India
                          </div>
                        </div>

                        {/* Website */}
                        <div className="flex items-center gap-3 pt-2">
                          <div className="h-4 w-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                          </div>
                          <div className="text-cyan-600 font-medium text-sm">
                            www.gavithbuild.com
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Shadow Enhancement */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl blur-xl -z-10 opacity-50"></div>
                  </div>
                </div>

                {/* CTA Card */}
                <div className="floor-content-item opacity-0 transform translate-y-[50px]">
                  <Card className="bg-white/10 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-400/40 transition-all duration-500 max-w-2xl mx-auto">
                    <CardHeader className="text-center p-8">
                      <CardTitle className="text-3xl font-bold text-white mb-2">
                        Executive Trial Access
                      </CardTitle>
                      <CardDescription className="text-cyan-100/80 text-lg">
                        Experience enterprise-grade excellence for 30 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xl py-6 font-bold shadow-2xl shadow-cyan-500/40 border-0 futuristic-button pulse-glow"
                        onClick={onGetStarted}
                      >
                        Begin Your Empire
                        <ArrowRight className="ml-3 h-6 w-6" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full bg-white/5 border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-400/50 text-lg py-4 backdrop-blur-sm"
                        onClick={onLogin}
                      >
                        Schedule Executive Demo
                      </Button>

                      {/* Additional Contact Options */}
                      <div className="pt-4 border-t border-cyan-400/20">
                        <h4 className="text-white font-semibold mb-4 text-center">Quick Connect</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="bg-white/5 border-blue-400/30 text-blue-200 hover:bg-blue-500/10 text-sm py-3"
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Call Now
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-white/5 border-green-400/30 text-green-200 hover:bg-green-500/10 text-sm py-3"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-cyan-200/60 text-center">
                        White-glove onboarding • Dedicated success manager • Premium support
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer with Logo Theme */}
          <footer className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 border-t border-cyan-500/20 py-16">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-blue-900/10"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center gap-4 mb-8 md:mb-0">
                  <ImageWithFallback
                    src={gavithLogo}
                    alt="Gavith Build Logo"
                    className="h-12 w-12 object-contain float-animation"
                    width={48}
                    height={48}
                    sizes="48px"
                  />
                  <div>
                    <div className="gavith-text-gradient font-bold text-xl">Gavith Build</div>
                    <div className="text-cyan-200/70">Construction Management System</div>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <p className="text-cyan-200/70">© 2024 Gavith Build. All rights reserved.</p>
                  <p className="text-cyan-300/60 text-sm mt-1">
                    Empowering construction excellence through advanced technology
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
