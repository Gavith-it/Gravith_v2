'use client';

import type { MotionValue } from 'framer-motion';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import type React from 'react';
import { useRef, memo } from 'react';

interface CardData {
  title: string;
  description: string;
  image: string;
  color?: string;
  rotation?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const DominoesItem = memo(
  ({
    card,
    index,
    scrollYProgress,
    totalItems,
    height,
    width,
    enableShadow,
  }: {
    card: CardData;
    index: number;
    scrollYProgress: MotionValue<number>;
    totalItems: number;
    height: number;
    width: number;
    enableShadow: boolean;
  }) => {
    const thisDominoePosition = index / totalItems;
    const preStep = Math.max(0, thisDominoePosition - 0.04);
    const postStep = Math.min(1, thisDominoePosition + 0.04);
    const rotateX = useTransform(
      scrollYProgress,
      [0, preStep, thisDominoePosition, postStep, 1],
      [0, 0, 0, 90, 90],
    );
    const antiRotateX = useTransform(
      scrollYProgress,
      [0, preStep, thisDominoePosition, postStep, 1],
      [90, 90, 90, 0, 0],
    );
    const translateZ = useTransform(
      scrollYProgress,
      [0, preStep, thisDominoePosition, postStep, 1],
      [-height * index, -height, 0, height, height * (totalItems - index)],
    );
    const antiSkewX = useTransform(
      scrollYProgress,
      [0, preStep, thisDominoePosition, postStep, 1],
      [30, 30, 30, 0, 0],
    );
    const shadowOpacity = useTransform(
      scrollYProgress,
      [0, preStep, thisDominoePosition, postStep, postStep, 1],
      [0.6, 0.6, 0.6, 0.6, 0, 0],
    );

    const Icon = card.icon;

    return (
      <motion.div
        style={{
          rotateX,
          translateZ,
          zIndex: totalItems - index,
          transformOrigin: 'bottom',
          transformStyle: 'preserve-3d',
          height,
          width,
          transition: '100ms ease-out',
        }}
        className="absolute"
      >
        {/* shadow */}
        {enableShadow && (
          <motion.span
            style={{
              rotateX: antiRotateX,
              transformOrigin: 'bottom',
              skewX: antiSkewX,
              opacity: shadowOpacity,
              transition: '100ms ease-out',
            }}
            className="absolute inset-0 bg-black z-0 opacity-0 rounded-2xl"
          />
        )}
        <article
          className={`h-full w-full rounded-2xl ${card.rotation || ''} p-10 grid gap-6 shadow-2xl relative overflow-hidden border-2 border-white/30 hover:border-cyan-400/70 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40`}
          style={{ backgroundColor: card.color || '#0891b2' }}
        >
          {/* Decorative squares on cards */}
          <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/20 rounded-sm rotate-12"></div>
          <div className="absolute bottom-6 left-6 w-12 h-12 border-2 border-white/15 rounded-sm -rotate-6"></div>
          <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-sm rotate-45"></div>

          <div className="flex items-center gap-4 relative z-10">
            {Icon && <Icon className="w-10 h-10 text-white" />}
            <h2 className="text-3xl font-semibold text-white">{card.title}</h2>
          </div>

          <p className="text-white/90 leading-relaxed relative z-10 text-lg">{card.description}</p>

          {card.image && (
            <div className="relative z-10 flex-1">
              <div className="w-full h-64 overflow-hidden rounded-xl shadow-2xl border-2 border-white/20">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={width}
                  height={256}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            </div>
          )}
        </article>
      </motion.div>
    );
  },
);

DominoesItem.displayName = 'DominoesItem';

const DominoesListScroll = ({
  items,
  height = 512,
  width = 720,
  enableShadow = false,
  onScrollProgress,
}: {
  items: CardData[];
  height?: number;
  width?: number;
  enableShadow?: boolean;
  onScrollProgress?: (progress: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (onScrollProgress) {
      onScrollProgress(latest);
    }
  });

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div className="sticky top-0 left-0 h-screen w-full flex items-center justify-center z-10 pointer-events-none">
        <div
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
          className="flex flex-col items-center justify-center w-full"
        >
          {items.map((item, index) => (
            <DominoesItem
              key={`dominoe-${index}`}
              card={item}
              index={index}
              scrollYProgress={scrollYProgress}
              totalItems={items.length}
              height={height}
              width={width}
              enableShadow={enableShadow}
            />
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="w-full overflow-y-auto h-full bg-transparent absolute top-0 left-0 hide-scrollbar"
      >
        <div
          style={{
            height: items.length * height,
          }}
          className="w-full bg-transparent"
        ></div>
      </div>
    </div>
  );
};

export default DominoesListScroll;
