'use client';

import type { MotionValue } from 'framer-motion';
import { useTransform, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';


interface FeatureData {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  imageUrl?: string;
}

interface CardProps {
  i: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  imageUrl?: string;
  totalCards: number;
  progress: MotionValue<number>;
}

export const FeatureCard = ({
  i,
  title,
  description,
  icon: Icon,
  color,
  imageUrl,
  totalCards,
  progress,
}: CardProps) => {
  // Calculate scroll ranges for each card
  // Each card gets equal scroll space, with small overlap
  const scrollStep = 1 / totalCards;
  const cardStart = i * scrollStep;
  const cardEnd = (i + 1) * scrollStep;

  // Progress for this specific card (0 to 1 as it scrolls into view)
  const cardProgress = useTransform(progress, [Math.max(0, cardStart - 0.05), cardEnd], [0, 1], {
    clamp: true,
  });

  // Y position: Cards start stacked, move to center when active, then move up
  const stackedOffset = i * 25; // Initial stack offset
  const yPosition = useTransform(
    cardProgress,
    [0, 0.3, 0.7, 1],
    [
      stackedOffset, // Start: stacked below (all cards visible)
      0, // Move to center when becoming active
      0, // Stay at center
      -500, // Move up and out when done
    ],
  );

  // Scale: Cards get smaller as they go deeper in stack
  const baseScale = 1 - (totalCards - i - 1) * 0.05;
  const scale = useTransform(
    cardProgress,
    [0, 0.4, 0.8, 1],
    [
      baseScale, // Start at stacked scale (smaller when behind)
      1, // Full size when active
      1, // Stay full size
      0.9, // Slightly shrink when leaving
    ],
  );

  // Opacity: Show all cards stacked, highlight active one
  const opacity = useTransform(
    cardProgress,
    [0, 0.2, 0.8, 1],
    [
      i === 0 ? 1 : 0.5, // First card visible, others dim when stacked
      1, // Fully visible when active
      1, // Stay visible
      0, // Fade out when moving up and out
    ],
  );

  // Image scale: Zoom in as card becomes active
  const imageScale = useTransform(cardProgress, [0, 0.5], [1.5, 1]);

  return (
    <motion.div
      style={{
        backgroundColor: color,
        scale,
        y: yPosition,
        opacity,
        zIndex: totalCards - i,
      }}
      className="flex flex-col absolute left-1/2 -translate-x-1/2 h-[450px] w-[90%] max-w-5xl rounded-lg p-10 border border-cyan-400/30 backdrop-blur-sm shadow-2xl"
    >
      <h2 className="text-2xl md:text-3xl text-center font-semibold text-white mb-6">{title}</h2>
      <div className="flex flex-col md:flex-row h-full mt-5 gap-10">
        <div className="w-full md:w-[40%] relative top-[10%]">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-xl flex items-center justify-center border border-cyan-400/40">
              <Icon className="h-8 w-8 text-cyan-300" />
            </div>
          </div>
          <p className="text-sm md:text-base text-blue-100/90 leading-relaxed mb-4">
            {description}
          </p>
          <span className="flex items-center gap-2 pt-2">
            <a
              href="#features"
              className="underline cursor-pointer text-cyan-300 hover:text-cyan-200 transition-colors flex items-center gap-2"
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </a>
          </span>
        </div>

        {imageUrl && (
          <div className="relative w-full md:w-[60%] h-full rounded-lg overflow-hidden">
            <motion.div className="w-full h-full relative" style={{ scale: imageScale }}>
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface StackingCardRootProps {
  features: FeatureData[];
  scrollProgress: MotionValue<number>;
}

export default function StackingCard({ features, scrollProgress }: StackingCardRootProps) {
  return (
    <div
      className="relative w-full"
      style={{
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Cards container - all cards stack here at same position */}
      <div className="relative w-full h-full flex items-center justify-center">
        {features.map((feature, i) => (
          <FeatureCard
            key={`feature_${i}`}
            i={i}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            color={feature.color}
            imageUrl={feature.imageUrl}
            totalCards={features.length}
            progress={scrollProgress}
          />
        ))}
      </div>
    </div>
  );
}
