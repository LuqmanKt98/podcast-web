import { Variants, Transition } from 'framer-motion';

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Page transition animations
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition: Transition = {
  duration: 0.4,
  ease: 'easeInOut',
};

// Fade in animation
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// Slide up animation
export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

// Scale animation
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
};

// Stagger container for children animations
export const staggerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Stagger item animation
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Hover scale animation
export const hoverScaleVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
};

// Glow animation
export const glowVariants: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
  hover: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0.4)',
      '0 0 0 10px rgba(59, 130, 246, 0)',
    ],
  },
};

// Counter animation
export const counterVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// Shimmer loading animation
export const shimmerVariants: Variants = {
  initial: { backgroundPosition: '200% 0' },
  animate: {
    backgroundPosition: '-200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Badge animation
export const badgeVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  hover: { scale: 1.05 },
};

// Floating animation
export const floatingVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Pulse animation
export const pulseVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Rotate animation
export const rotateVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Parallax scroll effect
export const parallaxVariants = (offset: number): Variants => ({
  initial: { y: 0 },
  animate: { y: offset },
});

// Transition config for smooth animations
export const smoothTransition = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
};

// Get animation config based on user preference
export const getAnimationConfig = (
  normalConfig: any,
  reducedConfig: any = { duration: 0 }
) => {
  return prefersReducedMotion() ? reducedConfig : normalConfig;
};

