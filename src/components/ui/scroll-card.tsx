'use client';

import { ReactLenis } from 'lenis/react';
import React, { useRef, forwardRef } from 'react';

interface ArticleCardData {
  title: string;
  description: string;
  link: string;
  color: string;
  rotation: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ScrollCardProps {
  cardsData: ArticleCardData[];
  title?: string;
  subtitle?: string;
  sideTitle?: string;
}

const ScrollCard = forwardRef<HTMLElement, ScrollCardProps>(
  ({ cardsData, title, subtitle, sideTitle }, ref) => {
    return (
      <ReactLenis root>
        <main
          ref={ref}
          style={{
            background: 'radial-gradient(circle at center, #071F3F 0%, #02142A 60%, #010D1D 100%)',
          }}
        >
          {(title || subtitle) && (
            <section className="text-white h-auto py-20 w-full grid place-content-center relative top-0">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent"></div>

              {/* Decorative squares */}
              <div className="absolute top-10 left-20 w-20 h-20 border-2 border-cyan-400/30 rounded-sm rotate-12"></div>
              <div className="absolute top-16 right-20 w-16 h-16 border-2 border-blue-400/20 rounded-sm -rotate-6"></div>
              <div className="absolute top-20 left-1/3 w-12 h-12 bg-cyan-500/10 rounded-sm rotate-45"></div>

              {title && (
                <h1 className="2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%] relative z-10 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="text-xl text-center mt-4 text-cyan-100/80 relative z-10">
                  {subtitle}
                </p>
              )}
            </section>
          )}

          <section className="text-white w-full relative">
            <div className="flex justify-between px-8 lg:px-16 gap-8">
              <div className="w-full lg:w-1/2">
                {cardsData.map((card, i) => {
                  const Icon = card.icon;

                  return (
                    <div key={i} className="h-screen flex items-center justify-center">
                      <figure className="sticky top-0 w-full">
                        <article
                          className={`h-[32rem] w-full max-w-[45rem] mx-auto rounded-2xl ${card.rotation} p-10 grid gap-6 shadow-2xl relative overflow-hidden border-2 border-white/30 hover:border-cyan-400/70 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40`}
                          style={{ backgroundColor: card.color }}
                        >
                          {/* Decorative squares on cards */}
                          <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/20 rounded-sm rotate-12"></div>
                          <div className="absolute bottom-6 left-6 w-12 h-12 border-2 border-white/15 rounded-sm -rotate-6"></div>
                          <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-sm rotate-45"></div>

                          <div className="flex items-center gap-4 relative z-10">
                            {Icon && <Icon className="w-10 h-10 text-white" />}
                            <h2 className="text-3xl font-semibold text-white">{card.title}</h2>
                          </div>

                          <p className="text-white/90 leading-relaxed relative z-10 text-lg">
                            {card.description}
                          </p>

                          {card.link && (
                            <div className="relative z-10 flex-1">
                              <div className="w-full h-64 overflow-hidden rounded-xl shadow-2xl border-2 border-white/20">
                                <img
                                  src={card.link}
                                  alt={card.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}
                        </article>
                      </figure>
                    </div>
                  );
                })}
              </div>

              <div className="sticky top-0 h-screen grid place-content-center w-1/2 hidden lg:block">
                <h1 className="text-5xl px-8 font-semibold text-center tracking-tight leading-[120%] bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {sideTitle || 'Explore All Features'}
                </h1>
              </div>
            </div>
          </section>
        </main>
      </ReactLenis>
    );
  },
);

ScrollCard.displayName = 'ScrollCard';

export default ScrollCard;
