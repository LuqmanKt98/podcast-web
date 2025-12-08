'use client';

import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { useScrollAnimation } from '@/lib/useScrollAnimation';
import { prefersReducedMotion } from '@/lib/animations';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode | string;
  color?: 'blue' | 'purple' | 'green' | 'orange';
}

const colorClasses = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50',
  green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  green: 'text-emerald-600',
  orange: 'text-orange-600',
};

export default function StatsCard({
  label,
  value,
  icon,
  color = 'blue',
}: StatsCardProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const reducedMotion = prefersReducedMotion();
  const isNumeric = typeof value === 'number';
  const isDateRange = typeof value === 'string' && (value.includes(' to ') || value.includes(' - '));
  const dateRangeSeparator = typeof value === 'string' && value.includes(' - ') ? ' - ' : ' to ';

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: reducedMotion ? 0 : 0.5 }}
      whileHover={reducedMotion ? {} : { y: -4, scale: 1.02 }}
      className={`relative overflow-hidden h-32 backdrop-blur-sm border-2 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${colorClasses[color]}`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />

      {/* Floating orb effect */}
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${iconColorClasses[color]} opacity-10 blur-xl`} />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">{label}</p>
          {icon && (
            <motion.div
              initial={reducedMotion ? { scale: 1 } : { scale: 0, rotate: -180 }}
              animate={isVisible ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, delay: 0.1 }}
              className={`text-2xl ${iconColorClasses[color]} opacity-70`}
            >
              {icon}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, delay: 0.2 }}
          className="mt-2"
        >
          {isNumeric && isVisible ? (
            <div className="text-3xl font-black gradient-text">
              <AnimatedCounter
                value={value as number}
                duration={2000}
                shouldStart={isVisible}
              />
            </div>
          ) : isDateRange ? (
            <div className="space-y-0.5">
              <div className="text-base font-bold gradient-text leading-tight">
                {(value as string).split(dateRangeSeparator)[0]}
              </div>
              <div className="text-xs text-slate-500 font-medium">to</div>
              <div className="text-base font-bold gradient-text leading-tight">
                {(value as string).split(dateRangeSeparator)[1]}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-black gradient-text break-words">{value}</div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

