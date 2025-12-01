'use client';

import type { PanInfo } from 'framer-motion';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';

interface CardData {
  id: number;
  img: string;
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StackProps {
  cardsData: CardData[];
  cardDimensions: { width: number; height: number };
  randomRotation?: boolean;
  sensitivity?: number;
  sendToBackOnClick?: boolean;
}

export default function Stack({
  cardsData,
  cardDimensions,
  randomRotation = true,
  sensitivity = 180,
  sendToBackOnClick = false,
}: StackProps) {
  const [cards, setCards] = useState(cardsData);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [draggingOut, setDraggingOut] = useState<Map<number, { x: number; y: number }>>(new Map());

  // Initialize rotations deterministically based on card ID to avoid hydration mismatch
  const getRotation = (id: number) => {
    if (!randomRotation) return 0;
    // Use a simple hash function to generate deterministic "random" rotation
    // This ensures the same card ID always gets the same rotation (SSR-safe)
    const hash = id * 9301 + 49297; // Simple hash function
    const normalized = (hash % 1000) / 1000; // Normalize to 0-1
    return normalized * 10 - 5; // Scale to -5 to 5 degrees
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.3 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    id: number,
  ) => {
    const threshold = sensitivity;

    if (Math.abs(info.offset.x) > threshold || Math.abs(info.offset.y) > threshold) {
      // Store drag direction and mark card as dragging out
      setDraggingOut((prev) => new Map(prev).set(id, { x: info.offset.x, y: info.offset.y }));

      // After animation completes, move card to back of stack
      setTimeout(() => {
        setCards((prev) => {
          const draggedCard = prev.find((card) => card.id === id);
          const otherCards = prev.filter((card) => card.id !== id);
          return draggedCard ? [...otherCards, draggedCard] : prev;
        });
        // Remove from dragging out map
        setDraggingOut((prev) => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }, 400); // Wait for animation to complete
    }
  };

  const handleCardClick = (id: number) => {
    if (sendToBackOnClick) {
      setCards((prev) => {
        const clickedCard = prev.find((card) => card.id === id);
        const otherCards = prev.filter((card) => card.id !== id);
        return clickedCard ? [...otherCards, clickedCard] : prev;
      });
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
        style={{ width: cardDimensions.width, height: cardDimensions.height }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ width: cardDimensions.width, height: cardDimensions.height }}
    >
      {cards.map((card, index) => {
        const rotation = getRotation(card.id);
        const zIndex = cards.length - index;
        const dragInfo = draggingOut.get(card.id);
        const isDraggingOut = !!dragInfo;
        const isNewPosition = index === cards.length - 1 && !isDraggingOut;

        // Calculate exit direction
        let exitX = 0;
        let exitY = 0;
        if (dragInfo) {
          if (Math.abs(dragInfo.x) > Math.abs(dragInfo.y)) {
            exitX = dragInfo.x > 0 ? 1000 : -1000;
          } else {
            exitY = dragInfo.y > 0 ? 1000 : -1000;
          }
        }

        return (
          <motion.div
            key={card.id}
            drag
            dragConstraints={false}
            dragElastic={0.2}
            onDragEnd={(event, info) => handleDragEnd(event, info, card.id)}
            onClick={() => handleCardClick(card.id)}
            initial={{
              y: 800,
              rotate: rotation,
              scale: 1 - index * 0.05,
              opacity: 0,
            }}
            animate={
              isDraggingOut
                ? {
                    // Animate card off-screen based on drag direction
                    x: exitX,
                    y: exitY,
                    rotate: rotation + (dragInfo?.x || 0) * 0.1,
                    scale: 0.5,
                    opacity: 0,
                  }
                : isInView
                  ? {
                      x: 0,
                      y: -index * 10,
                      rotate: rotation,
                      scale: 1 - index * 0.05,
                      opacity: 1,
                    }
                  : {
                      x: 0,
                      y: 800,
                      rotate: rotation,
                      scale: 1 - index * 0.05,
                      opacity: 0,
                    }
            }
            transition={
              isDraggingOut
                ? {
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                    duration: 0.4,
                  }
                : {
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    delay: isNewPosition ? 0.4 : index * 0.15,
                    opacity: {
                      duration: 0.3,
                      delay: isNewPosition ? 0.4 : index * 0.15,
                    },
                  }
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.1 }}
            className="absolute cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 backdrop-blur-xl"
            style={{
              width: cardDimensions.width,
              height: cardDimensions.height,
              zIndex: zIndex,
              backgroundImage: `url(${card.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            suppressHydrationWarning
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              {card.icon && (
                <div className="mb-3">
                  <card.icon className="w-10 h-10 text-white" />
                </div>
              )}
              {card.title && <h3 className="font-bold text-white text-xl mb-2">{card.title}</h3>}
              {card.description && <p className="text-white/90 text-sm">{card.description}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
