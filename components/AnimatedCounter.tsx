'use client';

import { useCountUp } from '@/lib/useScrollAnimation';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  shouldStart?: boolean;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 2000,
  shouldStart = true,
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const count = useCountUp(value, duration, shouldStart);

  return (
    <>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

