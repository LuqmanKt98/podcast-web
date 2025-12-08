'use client';

import { motion } from 'framer-motion';
import { shimmerVariants, prefersReducedMotion } from '@/lib/animations';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'text' | 'stats';
  className?: string;
}

export default function SkeletonLoader({
  count = 3,
  type = 'card',
  className = '',
}: SkeletonLoaderProps) {
  const reducedMotion = prefersReducedMotion();

  const getSkeletonContent = () => {
    switch (type) {
      case 'stats':
        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
                <div className="h-8 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        );

      case 'text':
        // Use deterministic widths to avoid hydration mismatch
        const textWidths = [85, 92, 78, 95, 88, 90, 83, 97, 86, 91];
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-gray-200"
                style={{ width: `${textWidths[i % textWidths.length]}%` }}
              />
            ))}
          </div>
        );

      case 'card':
      default:
        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="mb-4 h-6 w-24 rounded bg-gray-200" />
                <div className="mb-3 h-4 w-full rounded bg-gray-200" />
                <div className="mb-3 h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-4/6 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        );
    }
  };

  if (reducedMotion) {
    return <div className={className}>{getSkeletonContent()}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      style={{
        backgroundImage:
          'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
        backgroundSize: '200% 100%',
      }}
    >
      {getSkeletonContent()}
    </motion.div>
  );
}

