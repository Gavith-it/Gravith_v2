'use client';

import { Check, ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';

import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';

import { FeaturesSection } from './FeaturesSection';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface SaaSHomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function SaaSHomepage({ onGetStarted, onLogin }: SaaSHomepageProps) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  // Header hide/show on scroll with throttling
  useEffect(() => {
    const handleScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.pageYOffset;

          if (currentScrollY > 100) {
            if (currentScrollY > lastScrollYRef.current) {
              // Scrolling down
              setHeaderVisible(false);
            } else {
              // Scrolling up
              setHeaderVisible(true);
            }
          } else {
            // At the top
            setHeaderVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pricingFeatures = [
    'Unlimited Sites & Projects',
    'Vehicle & Equipment Tracking',
    'Material Inventory Management',
    'Expense Management',
    'Vendor Management',
    'Real-time Analytics',
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        margin: 0,
        padding: 0,
        background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
      }}
    >
      {/* Header with hide/show on scroll */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ease-in-out ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ margin: 0, padding: 0 }}
      >
        <div className="bg-gradient-to-r from-cyan-500/70 via-blue-600/70 to-blue-700/70 backdrop-blur-md border-b border-cyan-400/20 shadow-2xl shadow-cyan-500/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-10 sm:h-12">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ImageWithFallback
                    src={gavithLogo}
                    alt="Gavith Build Logo"
                    className="h-7 w-7 object-contain float-animation"
                    width={28}
                    height={28}
                    sizes="28px"
                  />
                  <div className="absolute inset-0 bg-cyan-300/30 rounded-full blur-lg -z-10"></div>
                </div>
                <div>
                  <h1 className="text-white font-bold text-base drop-shadow-2xl tracking-tight">
                    Gavith Build
                  </h1>
                  <p className="text-cyan-50 text-xs font-medium tracking-wide hidden sm:block">
                    Construction Management
                  </p>
                </div>
              </div>

              <nav className="hidden lg:flex items-center gap-4 xl:gap-7">
                <a
                  href="#features"
                  className="text-cyan-50 hover:text-white text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-cyan-50 hover:text-white text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Pricing
                </a>
                <a
                  href="#contact"
                  className="text-cyan-50 hover:text-white text-sm font-medium transition-all duration-300 hover:scale-110"
                >
                  Contact
                </a>
              </nav>

              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-50 hover:text-white hover:bg-white/10 border border-cyan-200/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2"
                  onClick={onLogin}
                >
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Sign In</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-white via-cyan-50 to-white text-blue-700 hover:from-cyan-50 hover:via-white hover:to-cyan-50 font-bold text-xs sm:text-sm px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 shadow-2xl shadow-white/30 border-0 transition-all duration-300 hover:scale-105"
                  onClick={onGetStarted}
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                  <ArrowRight className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Screen from top, starts behind header */}
      <section
        className="relative overflow-visible"
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          minHeight: 'calc(100vh + 100px)', // Extend hero section to show more of building
          height: 'calc(100vh + 100px)',
          width: '100%',
          maxWidth: '100%',
          background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
        }}
      >
        {/* Hero Background Image - Starts below header, shows full image */}
        <div
          style={{
            position: 'absolute',
            top: '48px', // Start below header (header height is 48px)
            left: 0,
            right: 0,
            width: '100%',
            height: 'calc(100vh + 100px - 48px)', // Extended height to show full building
            zIndex: 0,
            backgroundColor: '#071F3F', // Match background gradient color
          }}
        >
          <ImageWithFallback
            src="/gavith1.jpeg"
            alt="Gavith Build Construction Management Platform"
            className="w-full h-full"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover', // Fill container - image is 2000x1400px, perfect for hero section
              objectPosition: 'right center', // Center the image to show crane and building
              margin: 0,
              padding: 0,
            }}
            width={2000}
            height={1400}
            sizes="100vw"
            priority
          />
        </div>
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent"
          style={{ zIndex: 1 }}
        ></div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center z-10 animate-bounce">
          <div className="flex flex-col items-center space-y-3">
            <span className="text-cyan-100 font-semibold drop-shadow-2xl tracking-wider">
              Scroll to Explore
            </span>
            <div
              className="w-7 h-14 border-2 border-cyan-300/70 rounded-full flex justify-center backdrop-blur-md bg-cyan-400/20 shadow-2xl shadow-cyan-400/50"
              style={{ borderWidth: '3px' }}
            >
              <div className="w-2 h-5 bg-cyan-200 rounded-full mt-2.5 shadow-lg shadow-cyan-200/70 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean White Background */}
      <FeaturesSection />

      {/* Pricing Section - Compact */}
      <section
        id="pricing"
        className="relative py-24"
        style={{
          background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl px-4">
              Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100/80 px-4">
              One simple plan with everything included
            </p>
          </div>

          <Card className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border-2 border-blue-400/40 shadow-2xl shadow-blue-500/30 hover:shadow-cyan-500/50 transition-all duration-500 hover:scale-105">
            <CardHeader className="text-center p-8">
              <CardTitle className="text-3xl font-bold text-white mb-4">
                Professional Plan
              </CardTitle>

              <div className="text-center my-6">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  ₹500
                  <span className="text-xl text-blue-200/70 font-normal">/user/month</span>
                </div>
                <p className="text-blue-200/70 text-base">
                  + Setup: <span className="font-bold text-cyan-400 text-lg">₹25,000</span>
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-0">
              <div className="grid md:grid-cols-2 gap-4">
                {pricingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2.5 group">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center group-hover:bg-cyan-400/30 transition-colors duration-300">
                      <Check className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <span className="text-blue-100/90 text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section - Full Screen */}
      <section
        id="contact"
        className="relative min-h-screen flex items-center justify-center py-20"
        style={{
          background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl px-4">
              Start Your Journey Today
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
            {/* Contact Info Card */}
            <Card className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border-2 border-cyan-400/40 hover:border-cyan-400/60 transition-all duration-500 p-10 hover:scale-105 shadow-2xl shadow-cyan-500/30">
              <div className="flex items-center gap-4 mb-10">
                <div className="relative">
                  <ImageWithFallback
                    src={gavithLogo}
                    alt="Gavith Build Logo"
                    className="h-16 w-16 object-contain"
                    width={64}
                    height={64}
                    sizes="64px"
                  />
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl -z-10"></div>
                </div>
                <div>
                  <h4 className="font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent text-2xl">
                    Gavith Build
                  </h4>
                  <p className="text-cyan-100/90 font-medium">Construction Management</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors duration-300 border border-cyan-400/30">
                    <Mail className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-cyan-100 font-semibold text-lg">
                    partnerships@gavithbuild.com
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300 border border-blue-400/30">
                    <Phone className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-cyan-100 font-semibold text-lg">+91 98765 43210</div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center group-hover:bg-slate-500/30 transition-colors duration-300 flex-shrink-0 border border-slate-400/30">
                    <MapPin className="h-6 w-6 text-slate-300" />
                  </div>
                  <div className="text-cyan-100 font-semibold text-lg">
                    Bangalore Financial District, Karnataka
                  </div>
                </div>
              </div>
            </Card>

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border-2 border-cyan-400/40 hover:border-cyan-400/60 transition-all duration-500 p-10 hover:scale-105 shadow-2xl shadow-cyan-500/30">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-4xl font-bold text-white mb-4">
                  Start Free Trial
                </CardTitle>
                <CardDescription className="text-cyan-100/90 text-xl">
                  Experience enterprise excellence for 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-8 text-xl font-bold shadow-2xl shadow-cyan-500/50 border-0 transition-all duration-300 hover:scale-105"
                  onClick={onGetStarted}
                >
                  Get Started
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full bg-white/10 border-2 border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-400/60 py-8 text-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  onClick={() =>
                    (window.location.href =
                      'mailto:partnerships@gavithbuild.com?subject=Schedule Demo Request&body=Hi, I would like to schedule a demo of Gavith Build.')
                  }
                >
                  Schedule Demo
                </Button>

                <div className="pt-6 border-t-2 border-cyan-400/30">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/10 border-2 border-blue-400/40 text-blue-200 hover:bg-blue-500/20 py-6 text-lg"
                      onClick={() => (window.location.href = 'tel:+919876543210')}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/10 border-2 border-green-400/40 text-green-200 hover:bg-green-500/20 py-6 text-lg"
                      onClick={() =>
                        window.open(
                          'https://wa.me/919876543210?text=Hi, I am interested in Gavith Build.',
                          '_blank',
                        )
                      }
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative border-t border-cyan-500/30 py-16"
        style={{
          background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-blue-900/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-5 mb-8 md:mb-0">
              <div className="relative">
                <ImageWithFallback
                  src={gavithLogo}
                  alt="Gavith Build Logo"
                  className="h-14 w-14 object-contain float-animation"
                  width={56}
                  height={56}
                  sizes="56px"
                />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl -z-10"></div>
              </div>
              <div>
                <div className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold text-2xl">
                  Gavith Build
                </div>
                <div className="text-cyan-200/70 font-medium">Construction Management System</div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-cyan-200/70 text-lg mb-2">
                © 2024 Gavith Build. All rights reserved.
              </p>
              <p className="text-cyan-300/60 font-medium">Empowering construction excellence</p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
