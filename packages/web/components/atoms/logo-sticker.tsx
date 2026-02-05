'use client';

import { cn } from '@/lib/utils';

/**
 * Color variants using design tokens.
 */
export type LogoStickerColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

const fillClasses: Record<LogoStickerColor, string> = {
  primary: 'fill-primary',
  success: 'fill-success',
  warning: 'fill-warning',
  error: 'fill-error',
  info: 'fill-info',
} as const;

/**
 * Size variants for the logo sticker.
 */
const sizeClasses = {
  xs: 'w-8 h-10',
  sm: 'w-12 h-14',
  md: 'w-16 h-[4.5rem]',
  lg: 'w-24 h-28',
  xl: 'w-32 h-[9.5rem]',
  '2xl': 'w-40 h-[12rem]',
  '3xl': 'w-64 h-[19rem]',
  '4xl': 'w-80 h-[24rem]',
} as const;

export interface LogoStickerProps {
  /**
   * The fill color of the logo.
   * @default 'primary'
   */
  color?: LogoStickerColor;
  /**
   * The size of the logo sticker.
   * @default 'md'
   */
  size?: keyof typeof sizeClasses;
  /**
   * Whether to show the arm (waving gesture).
   * @default true
   */
  showArm?: boolean;
  /**
   * Whether to animate the arm waving.
   * Only works when showArm is true.
   * @default false
   */
  waving?: boolean;
  /**
   * Whether to show a party hat on the head.
   * @default false
   */
  partyHat?: boolean;
  /**
   * Color of the party hat (if shown).
   * @default 'warning'
   */
  partyHatColor?: LogoStickerColor;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
}

// SVG path data
const HEAD_PATH =
  'M62.4375 111.375C93.1929 111.375 118.125 86.4429 118.125 55.6875C118.125 24.9321 93.1929 0 62.4375 0C31.6821 0 6.75 24.9321 6.75 55.6875C6.75 86.4429 31.6821 111.375 62.4375 111.375Z';
const BODY_PATH =
  'M0 162.562C0 128.079 27.9542 100.125 62.4375 100.125C96.9208 100.125 124.875 128.079 124.875 162.562V225H0V162.562Z';
const ARM_PATH =
  'M183.022 42.0739C172.613 34.3539 157.916 36.5342 150.196 46.9438L107.263 104.833C121.956 114.28 131.906 129.83 134.24 147.243L187.892 74.9004C195.612 64.4908 193.432 49.7939 183.022 42.0739Z';

// Pivot point where the arm connects to the body
// The arm path touches the body at L107.263 104.833, then curves along body to (134.24, 147.243)
// Best visual result is pivoting from the midpoint of this connection
const ARM_PIVOT_X = 120;
const ARM_PIVOT_Y = 126;

/**
 * The Groupi logo as a sticker with white outline.
 * Creates a die-cut sticker aesthetic with two-layer rendering
 * (stroke layer + fill layer) to avoid internal stroke overlaps.
 */
export function LogoSticker({
  color = 'primary',
  size = 'md',
  showArm = true,
  waving = false,
  partyHat = false,
  partyHatColor = 'warning',
  className,
}: LogoStickerProps) {
  // Adjust viewBox based on whether arm and party hat are shown
  // Party hat extends above the head, so we need more space at top
  const topOffset = partyHat ? -70 : -10;
  const height = partyHat ? 305 : 245;
  const viewBox = showArm
    ? `-10 ${topOffset} 217 ${height}`
    : `-10 ${topOffset} 145 ${height}`;

  // Arm animation styles
  const armAnimationStyle = waving
    ? {
        transformOrigin: `${ARM_PIVOT_X}px ${ARM_PIVOT_Y}px`,
        animation: 'wave 0.6s ease-in-out infinite',
      }
    : undefined;

  return (
    <>
      {/* Inject keyframes for waving animation */}
      {waving && (
        <style>{`
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-8deg); }
          }
        `}</style>
      )}
      <svg
        className={cn(sizeClasses[size], className)}
        viewBox={viewBox}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
      >
        {/* White outline layer - stroke only (body and head) */}
        <g className='stroke-white' strokeWidth='12' fill='none'>
          <path d={HEAD_PATH} />
          <path d={BODY_PATH} />
        </g>
        {/* Fill layer - covers internal stroke overlaps (body and head) */}
        <g className={fillClasses[color]}>
          <path d={HEAD_PATH} />
          <path d={BODY_PATH} />
        </g>
        {/* Party hat - rendered after head so it appears on top */}
        {partyHat && (
          <>
            {/* Hat stroke (white outline) - rounded bottom */}
            <path
              d='M 25 10 L 62 -45 L 99 10 Q 62 22 25 10 Z'
              className='stroke-white'
              strokeWidth='10'
              fill='none'
            />
            {/* Hat fill */}
            <path
              d='M 25 10 L 62 -45 L 99 10 Q 62 22 25 10 Z'
              className={fillClasses[partyHatColor]}
            />
            {/* Pom pom stroke */}
            <circle
              cx='62'
              cy='-45'
              r='12'
              className='stroke-white'
              strokeWidth='8'
              fill='none'
            />
            {/* Pom pom fill */}
            <circle cx='62' cy='-45' r='12' className='fill-error' />
          </>
        )}
        {/* Arm - separate group for animation */}
        {showArm && (
          <g style={armAnimationStyle}>
            <path
              d={ARM_PATH}
              className='stroke-white'
              strokeWidth='12'
              fill='none'
            />
            <path d={ARM_PATH} className={fillClasses[color]} />
          </g>
        )}
      </svg>
    </>
  );
}
