import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

interface BannerProps {
  banners: BannerItem[];
}

export default function Banner({ banners = [] }: BannerProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners.length) return null;

  const handlePrev = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[180px] sm:h-[260px] md:h-[320px] bg-zinc-900 shadow-xl group" id="promo-banner-container">
      {/* Slide rendering with Framer Motion animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[current].id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6 }}
          className="relative w-full h-full"
        >
          <img
            src={banners[current].image}
            alt={banners[current].title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
          />
          
          {/* Subtle gradient layover */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 sm:p-8 flex flex-col justify-end h-full" />
          
          {/* Content typography overlay */}
          <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end h-full max-w-xl text-left">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-bold leading-none bg-rose-600 text-white rounded-full uppercase tracking-widest w-fit mb-2 sm:mb-3">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Destaque</span>
            </div>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {banners[current].title}
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-base text-zinc-200 line-clamp-2 max-w-sm sm:max-w-md antialiased font-medium opacity-90">
              {banners[current].subtitle}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Manual Swiping Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
            id="banner-prev-btn"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
            id="banner-next-btn"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 h-6" />
          </button>

          {/* Bullet Indicators Dot-bar */}
          <div className="absolute bottom-4 right-6 z-20 hidden sm:flex space-x-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-350 ${
                  idx === current ? 'bg-rose-500 w-6' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
