'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

/**
 * Loading screen tips - witty advice for event planning and social life
 */
const LOADING_TIPS = [
  'Free food is a great way to make friends.',
  "It's your party. You can cry if you want to.",
  'Always pet the dog.',
  'The best time to RSVP was yesterday. The second best time is now.',
  "If you're early, you're on time. If you're on time, you're late. If you're late, bring snacks.",
  'The aux cord is a sacred responsibility.',
  "Friends don't let friends plan parties alone.",
  "You miss 100% of the hangouts you don't RSVP to.",
  "You can't cancel plans if you never make them. Wait, no—",
  "Rain is just nature's way of suggesting board games.",
  'Good hosts always have backup snacks.',
  'The best parties have at least one person who knows the WiFi password.',
  'If in doubt, add more cheese.',
  'Did you drink water today? Do that.',
  'Trust the person bringing dessert.',
  "Every great adventure starts with 'we should hang out sometime.'",
  'Naps before parties are strategically valid.',
  "You don't need a reason to celebrate. Make one up.",
  'Nobody has ever regretted bringing too many appetizers.',
  'The secret ingredient is always butter. Or showing up.',
  'A watched group chat never pings.',
  'Be the friend who remembers dietary restrictions.',
  'Comfortable shoes are an underrated party essential.',
  'The best conversations happen in the kitchen.',
  "Sometimes 'maybe' means 'convince me.'",
  'Bringing a plus one? A bottle of wine also counts.',
  'The early bird gets the good parking.',
  'No one ever remembers who brought the veggie tray. Be brave.',
  'Karaoke confidence is temporary. The videos are forever.',
  'When in doubt, blame it on traffic.',
];

interface LogoLoaderProps {
  className?: string;
  size?: number;
  /**
   * Whether to show a random tip below the loader
   */
  showTip?: boolean;
  /**
   * Custom tip text to display (overrides random tip)
   */
  tip?: string;
  /**
   * Color variant - 'auto' adapts to theme (white in dark, primary in light)
   * 'light' forces white, 'dark' forces dark color
   */
  variant?: 'auto' | 'light' | 'dark';
}

/**
 * Animated logo loader with waving arm.
 *
 * The arm pivots from the shoulder point (where it connects to the body).
 * The pivot point is at approximately (115, 120) in SVG coordinates - where
 * the arm arc meets the body arc.
 *
 * Animation: 2 waves, pause, then repeat.
 */
export function LogoLoader({
  className,
  size = 48,
  showTip = false,
  tip,
  variant = 'auto',
}: LogoLoaderProps) {
  const { resolvedTheme } = useTheme();

  // The SVG viewBox dimensions - extended to accommodate arm swing
  const viewBoxWidth = 220;
  const viewBoxHeight = 225;

  // Select a random tip once per mount
  /* eslint-disable react-hooks/purity -- Math.random() is intentionally used for one-time random selection on mount */
  const randomTip = useMemo(
    () => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)],
    []
  );
  /* eslint-enable react-hooks/purity */

  // Determine which tip to display
  const displayTip = tip ?? (showTip ? randomTip : undefined);

  // Determine color class based on variant and theme
  const colorClass = useMemo(() => {
    if (variant === 'light') return 'text-white';
    if (variant === 'dark') return 'text-gray-900';
    // Auto: white in dark mode, primary in light mode
    return resolvedTheme === 'dark' ? 'text-white' : 'text-primary';
  }, [variant, resolvedTheme]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <svg
        width={size}
        height={size * (viewBoxHeight / viewBoxWidth)}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={colorClass}
      >
        <defs>
          <style>{`
            @keyframes wave-arm {
              0%, 70%, 100% {
                transform: rotate(0deg);
              }
              12%, 35%, 58% {
                transform: rotate(-15deg);
              }
              23%, 47% {
                transform: rotate(18deg);
              }
            }
            .waving-arm {
              animation: wave-arm 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              transform-origin: 115px 120px;
            }
          `}</style>
        </defs>

        {/* Head - static */}
        <path
          d='M62.4375 111.375C93.1929 111.375 118.125 86.4429 118.125 55.6875C118.125 24.9321 93.1929 0 62.4375 0C31.6821 0 6.75 24.9321 6.75 55.6875C6.75 86.4429 31.6821 111.375 62.4375 111.375Z'
          fill='currentColor'
        />

        {/* Body - static */}
        <path
          d='M0 162.562C0 128.079 27.9542 100.125 62.4375 100.125C96.9208 100.125 124.875 128.079 124.875 162.562V225H0V162.562Z'
          fill='currentColor'
        />

        {/* Arm - animated with waving motion */}
        <path
          className='waving-arm'
          fillRule='evenodd'
          clipRule='evenodd'
          d='M183.022 42.0739C172.613 34.3539 157.916 36.5342 150.196 46.9438L107.263 104.833C121.956 114.28 131.906 129.83 134.24 147.243L187.892 74.9004C195.612 64.4908 193.432 49.7939 183.022 42.0739Z'
          fill='currentColor'
        />
      </svg>
      {displayTip && (
        <p className='text-sm text-muted-foreground text-center italic max-w-xs'>
          {displayTip}
        </p>
      )}
    </div>
  );
}
