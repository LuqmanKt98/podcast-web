'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { floatingVariants, prefersReducedMotion } from '@/lib/animations';

interface FloatingButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export default function FloatingButton({
  onClick,
  icon,
  label = 'Back to Top',
  className = '',
}: FloatingButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          variants={reducedMotion ? {} : floatingVariants}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0, y: 20 }}
          onClick={handleClick}
          aria-label={label}
          className={`fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${className}`}
        >
          {icon || (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

