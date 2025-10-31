import React, { useEffect, useState } from 'react';

import gavithLogo from '../assets/40b9a52cc41bb9e286b6859d260d4a3571e6e982.png';

import { ImageWithFallback } from './figma/ImageWithFallback';

interface LoadingScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function LoadingScreen({ isVisible, onComplete }: LoadingScreenProps) {
  const [animationStage, setAnimationStage] = useState<'initial' | 'lighting' | 'complete'>(
    'initial',
  );

  useEffect(() => {
    if (isVisible) {
      setAnimationStage('initial');

      // Start lighting animation
      const lightTimer = setTimeout(() => {
        setAnimationStage('lighting');
      }, 300);

      // Complete animation and fade out
      const completeTimer = setTimeout(() => {
        setAnimationStage('complete');
        setTimeout(() => {
          onComplete();
        }, 800);
      }, 2500);

      return () => {
        clearTimeout(lightTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 transition-opacity duration-800 ${
        animationStage === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particles">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center">
        {/* Logo with Enhanced Animations */}
        <div className="relative mb-8">
          <div
            className={`relative transition-all duration-1000 loading-logo-enhanced ${
              animationStage === 'initial' ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
            }`}
          >
            <ImageWithFallback
              src={gavithLogo}
              alt="Gavith Build Logo"
              className="h-40 w-40 object-contain relative z-10 filter drop-shadow-2xl floating-logo"
            />

            {/* Enhanced Glow Effect */}
            <div
              className={`absolute inset-0 bg-cyan-400/50 blur-3xl scale-110 transition-all duration-2000 ${
                animationStage === 'lighting'
                  ? 'opacity-100 scale-150 pulse-glow-loading'
                  : 'opacity-0 scale-110'
              }`}
            />

            {/* Additional Ring Effect */}
            <div
              className={`absolute inset-0 border-2 border-cyan-400/30 rounded-full scale-125 transition-all duration-2000 ${
                animationStage === 'lighting'
                  ? 'opacity-100 scale-150 animate-ping'
                  : 'opacity-0 scale-125'
              }`}
            />
          </div>
        </div>

        {/* Company Name - Always in Cyan, No Fading */}
        <div
          className={`text-center transition-transform duration-1000 delay-500 ${
            animationStage === 'initial' ? 'translate-y-4' : 'translate-y-0'
          }`}
        >
          <h1 className="text-6xl font-bold gavith-text-cyan text-shadow-glow mb-3 futuristic-text-loading">
            Gavith Build
          </h1>
          <p className="gavith-text-cyan-light text-xl font-medium tracking-wide futuristic-subtitle">
            Construction Management System
          </p>
        </div>

        {/* Enhanced Loading Indicator */}
        <div
          className={`mt-10 transition-all duration-1000 delay-1000 ${
            animationStage === 'initial'
              ? 'opacity-0'
              : animationStage === 'complete'
                ? 'opacity-0'
                : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"
              style={{ animationDelay: '200ms' }}
            />
            <div
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-lg shadow-cyan-400/50"
              style={{ animationDelay: '400ms' }}
            />
          </div>
          <p className="text-cyan-300 text-sm mt-4 font-medium text-center">Initializing...</p>
        </div>

        {/* Progress Bar */}
        <div
          className={`mt-6 transition-all duration-1000 delay-1500 ${
            animationStage === 'initial'
              ? 'opacity-0 scale-95'
              : animationStage === 'complete'
                ? 'opacity-0 scale-95'
                : 'opacity-100 scale-100'
          }`}
        >
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full loading-progress-bar"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid-lines"></div>
      </div>

      {/* Radial Gradients */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(6,182,212,0.3)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(37,99,235,0.3)_0%,transparent_50%)]" />
      </div>
    </div>
  );
}
