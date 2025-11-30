'use client';

import Lenis from 'lenis';
import type { ReactNode } from 'react';
import React, { useLayoutEffect, useRef, useCallback } from 'react';

export interface ScrollStackItemProps {
  children: ReactNode;
  itemClassName?: string;
}

export const ScrollStackItem = ({ children, itemClassName = '' }: ScrollStackItemProps) => (
  <div
    className={`scroll-stack-card relative w-full h-80 p-12 rounded-[40px] shadow-[0_0_30px_rgba(0,0,0,0.1)] box-border origin-center will-change-transform ${itemClassName}`.trim()}
    style={{
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d',
      WebkitBackfaceVisibility: 'hidden',
      isolation: 'isolate',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      contain: 'layout style paint',
    }}
  >
    {children}
  </div>
);

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '50%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  onStackComplete,
}: ScrollStackProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const stackCompletedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const scrollUpdateRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const lastTransformsRef = useRef(
    new Map<
      number,
      {
        translateY: number;
        scale: number;
        rotation: number;
        blur: number;
        opacity: number;
        zIndex: number;
      }
    >(),
  );
  const isUpdatingRef = useRef(false);
  const sectionStartRef = useRef<number | null>(null);

  // Get the number of cards
  const cardCount = React.Children.count(children);

  const updateCardTransforms = useCallback(() => {
    if (
      !cardsRef.current.length ||
      isUpdatingRef.current ||
      !containerRef.current ||
      !stickyRef.current
    ) {
      return;
    }

    isUpdatingRef.current = true;
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;

    // Get container position
    const containerRect = containerRef.current.getBoundingClientRect();

    // Check if container is sticky (top is at or very close to 0)
    const isSticky = containerRect.top <= 1 && containerRect.top >= -10;

    // Initialize section start BEFORE container becomes sticky
    // Calculate when container will reach top: 0 (sticky activation point)
    if (sectionStartRef.current === null) {
      if (containerRect.top > 0) {
        // Container hasn't reached top yet - calculate when it will
        sectionStartRef.current = scrollTop + containerRect.top;
      } else {
        // Container is already sticky or past sticky point
        sectionStartRef.current = scrollTop;
      }
    }

    const sectionStart = sectionStartRef.current;

    // Calculate scroll distance from section start
    const scrollDistance = scrollTop - sectionStart;
    const totalScrollDistance = cardCount * viewportHeight;

    // Only process card transitions when container is sticky
    // Before sticky, just show first card
    if (!isSticky) {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        if (i === 0) {
          card.style.opacity = '1';
          card.style.transform = 'translate3d(0, 0px, 0) scale(1)';
          card.style.zIndex = (cardCount + 10).toString();
          card.style.visibility = 'visible';
          card.style.pointerEvents = 'auto';
        } else {
          card.style.opacity = '0';
          card.style.transform = `translate3d(0, ${viewportHeight * 2}px, 0) scale(0.95)`;
          card.style.zIndex = '1';
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
        }
      });
      isUpdatingRef.current = false;
      return;
    }

    // Calculate progress - start from 0 when container reaches viewport top
    // scrollDistance will be negative before sticky, positive after
    let sectionProgress = Math.max(0, scrollDistance) / totalScrollDistance;

    // Clamp progress between 0 and 1 for card transitions
    sectionProgress = Math.max(0, Math.min(1, sectionProgress));

    // Debug logging (remove in production)
    if (isSticky && Math.abs(scrollDistance) % 50 < 5) {
      // Log roughly every 50px when sticky
      // Calculate active card correctly (matches card logic)
      const progressPerCard = 1 / cardCount;
      let activeCardIndex = 0;
      for (let i = 0; i < cardCount; i++) {
        const cardStart = i * progressPerCard;
        const cardEnd = (i + 1) * progressPerCard;
        if (sectionProgress >= cardStart && sectionProgress < cardEnd) {
          activeCardIndex = i;
          break;
        }
        if (sectionProgress >= cardEnd) {
          activeCardIndex = i;
        }
      }

      console.log(
        'ScrollStack: Scroll update',
        `scrollTop: ${Math.round(scrollTop)}, ` +
          `sectionStart: ${Math.round(sectionStart)}, ` +
          `scrollDistance: ${Math.round(scrollDistance)}, ` +
          `totalScrollDistance: ${Math.round(totalScrollDistance)}, ` +
          `sectionProgress: ${sectionProgress.toFixed(3)}, ` +
          `containerTop: ${Math.round(containerRect.top)}, ` +
          `activeCard: ${activeCardIndex}`,
      );
    }

    // Always process card transitions - cards should always update based on scroll position
    // Process all cards regardless of visibility to ensure smooth transitions
    {
      // Each card gets equal portion
      const progressPerCard = 1 / cardCount;

      const updates: Array<{
        card: HTMLElement;
        transform: string;
        filter: string;
        opacity: number;
        zIndex: number;
      }> = [];

      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        // Card i is active when progress is between i/cardCount and (i+1)/cardCount
        const cardStart = i * progressPerCard;
        const cardEnd = (i + 1) * progressPerCard;

        // Calculate progress within this card's range (0 to 1)
        let cardProgress = 0;
        if (sectionProgress >= cardStart && sectionProgress < cardEnd) {
          cardProgress = (sectionProgress - cardStart) / progressPerCard;
        } else if (sectionProgress >= cardEnd) {
          cardProgress = 1;
        }

        // Determine card state
        const isActive = sectionProgress >= cardStart && sectionProgress < cardEnd;
        const isPast = sectionProgress >= cardEnd;
        const isFuture = sectionProgress < cardStart;

        let translateY = 0;
        let scale = 1;
        let opacity = 0;
        let blur = 0;
        let zIndex = 1;

        if (isActive) {
          // Active card: slides up from below viewport to center
          translateY = viewportHeight * (1 - cardProgress); // Start at viewportHeight, end at 0
          scale = 0.95 + 0.05 * cardProgress;
          opacity = Math.min(1, 0.3 + 0.7 * cardProgress); // Fade in as it slides up, max 1
          blur = blurAmount > 0 ? blurAmount * (1 - cardProgress) : 0;
          zIndex = cardCount + 10; // Active card on top
        } else if (isPast) {
          // Past card: move above viewport and completely hide
          translateY = -viewportHeight * 2; // Move well above viewport
          scale = 0.85;
          opacity = 0; // Completely hidden
          blur = 0;
          zIndex = 1; // Lower z-index
        } else {
          // Future card: position below viewport, completely hidden
          translateY = viewportHeight * 2; // Position well below viewport
          scale = 0.95;
          opacity = 0; // Completely hidden
          blur = 0;
          zIndex = 1; // Lower z-index
        }

        // First card special case - ensure it's visible when progress is 0 or very small
        if (i === 0 && sectionProgress <= 0.01) {
          translateY = 0;
          scale = 1;
          opacity = 1;
          blur = 0;
          zIndex = cardCount + 10;
        }

        const rotation = rotationAmount ? i * rotationAmount * (1 - cardProgress) : 0;

        // Round values
        const newTransform = {
          translateY: Math.round(translateY * 10) / 10,
          scale: Math.round(scale * 1000) / 1000,
          rotation: Math.round(rotation * 10) / 10,
          blur: Math.round(blur * 10) / 10,
          opacity: Math.round(opacity * 100) / 100,
          zIndex: Math.round(zIndex),
        };

        const lastTransform = lastTransformsRef.current.get(i);
        const hasChanged =
          !lastTransform ||
          Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
          Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
          Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
          Math.abs(lastTransform.blur - newTransform.blur) > 0.05 ||
          Math.abs(lastTransform.opacity - newTransform.opacity) > 0.01 ||
          lastTransform.zIndex !== newTransform.zIndex;

        if (hasChanged) {
          const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale})${rotation ? ` rotate(${newTransform.rotation}deg)` : ''}`;
          const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

          updates.push({
            card,
            transform,
            filter,
            opacity: newTransform.opacity,
            zIndex: newTransform.zIndex,
          });
          lastTransformsRef.current.set(i, newTransform);
        }

        // Check if stack is complete
        if (i === cardsRef.current.length - 1 && isPast && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        }
      });

      // Apply updates - ensure only one card is visible
      updates.forEach(({ card, transform, filter, opacity, zIndex }) => {
        card.style.transform = transform;
        card.style.filter = filter;
        // Ensure opacity is clamped between 0 and 1
        const clampedOpacity = Math.max(0, Math.min(1, opacity));
        card.style.opacity = clampedOpacity.toString();
        card.style.zIndex = zIndex.toString();
        // Hide card completely if opacity is 0
        if (clampedOpacity === 0) {
          card.style.pointerEvents = 'none';
          card.style.visibility = 'hidden';
        } else {
          card.style.pointerEvents = 'auto';
          card.style.visibility = 'visible';
        }
      });
    }

    isUpdatingRef.current = false;
  }, [cardCount, rotationAmount, blurAmount, onStackComplete]);

  const handleScroll = useCallback(() => {
    if (scrollUpdateRef.current !== null) {
      cancelAnimationFrame(scrollUpdateRef.current);
    }

    scrollUpdateRef.current = requestAnimationFrame(() => {
      updateCardTransforms();
      scrollUpdateRef.current = null;
    });
  }, [updateCardTransforms]);

  // Also add direct scroll handler for debugging
  const handleDirectScroll = useCallback(() => {
    updateCardTransforms();
  }, [updateCardTransforms]);

  const setupLenis = useCallback(() => {
    if (!useWindowScroll) {
      return;
    }

    try {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
        infinite: false,
        wheelMultiplier: 1,
        lerp: 0.08,
        syncTouch: true,
        syncTouchLerp: 0.1,
      });

      // Lenis scroll event fires on every scroll frame
      lenis.on('scroll', () => {
        updateCardTransforms();
      });

      const raf = (time: number) => {
        lenis.raf(time);
        animationFrameRef.current = requestAnimationFrame(raf);
      };

      animationFrameRef.current = requestAnimationFrame(raf);
      lenisRef.current = lenis;

      return lenis;
    } catch (error) {
      console.error('ScrollStack: Lenis initialization failed', error);
      return null;
    }
  }, [updateCardTransforms, useWindowScroll]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.error('ScrollStack: container not found');
      return;
    }

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.scroll-stack-card'));

    if (cards.length === 0) {
      console.error('ScrollStack: no cards found');
      return;
    }

    console.log('ScrollStack: Initializing with', cards.length, 'cards');

    cardsRef.current = cards;
    const transformsCache = lastTransformsRef.current;

    // Don't set sectionStart here - let updateCardTransforms calculate it correctly
    // when the container actually becomes sticky

    // Removed initial setup log to reduce console spam

    // Set up sticky container
    if (stickyRef.current) {
      stickyRef.current.style.position = 'sticky';
      stickyRef.current.style.top = '0px';
      stickyRef.current.style.height = '100vh';
      stickyRef.current.style.width = '100%';
      stickyRef.current.style.display = 'flex';
      stickyRef.current.style.alignItems = 'center';
      stickyRef.current.style.justifyContent = 'center';
      stickyRef.current.style.zIndex = '10';
      stickyRef.current.style.overflow = 'visible';
      stickyRef.current.style.backgroundColor = 'transparent';
    }

    // Initialize cards - only first card visible, others hidden below
    const viewportHeight = window.innerHeight;
    cards.forEach((card, i) => {
      card.style.willChange = 'transform, filter, opacity, z-index';
      card.style.transformOrigin = 'center center';
      card.style.backfaceVisibility = 'hidden';
      card.style.transition = 'none';
      card.style.pointerEvents = 'auto';
      card.style.isolation = 'isolate';
      card.style.position = 'absolute';
      card.style.top = '0';
      card.style.left = '0';
      card.style.right = '0';
      card.style.bottom = '0';

      if (i === 0) {
        // First card: visible and centered
        card.style.opacity = '1';
        card.style.transform = 'translate3d(0, 0px, 0) scale(1)';
        card.style.filter = 'none';
        card.style.zIndex = (cardCount + 10).toString();
        card.style.visibility = 'visible';
      } else {
        // Other cards: hidden below viewport (match update logic)
        card.style.opacity = '0';
        card.style.transform = `translate3d(0, ${viewportHeight * 2}px, 0) scale(0.95)`;
        card.style.filter = 'none';
        card.style.zIndex = '1';
        card.style.visibility = 'hidden';
        card.style.pointerEvents = 'none';
      }
    });

    // Set container height to create scroll space for sticky effect
    // Use viewportHeight in pixels to match scroll calculation
    const containerHeight = cardCount * viewportHeight;
    container.style.height = `${containerHeight}px`;
    container.style.position = 'relative';
    container.style.overflow = 'visible';
    container.style.minHeight = `${containerHeight}px`;

    // Reset completion flag
    stackCompletedRef.current = false;

    setupLenis();

    // Initial update after a short delay to ensure DOM is ready
    setTimeout(() => {
      updateCardTransforms();
    }, 100);

    // Only listen to resize events - Lenis handles scroll
    window.addEventListener('resize', updateCardTransforms, { passive: true });

    // Immediate update
    updateCardTransforms();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollUpdateRef.current) {
        cancelAnimationFrame(scrollUpdateRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      window.removeEventListener('resize', updateCardTransforms);
      stackCompletedRef.current = false;
      cardsRef.current = [];
      transformsCache.clear();
      isUpdatingRef.current = false;
      sectionStartRef.current = null;
    };
  }, [
    cardCount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
    setupLenis,
    updateCardTransforms,
    handleScroll,
    handleDirectScroll,
  ]);

  // Removed render log to reduce console spam

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`.trim()}
      style={{
        overscrollBehavior: 'contain',
      }}
    >
      <div
        ref={stickyRef}
        className="relative w-full max-w-5xl mx-auto"
        style={{
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollStack;
