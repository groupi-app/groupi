'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useGlobalUser } from '@/context/global-user-context';
import { LogoSticker } from '@/components/atoms';
import { StickerCard, StepItem } from '@/components/molecules';

// Word pool for typewriter animation - ordered for best visual impact
// These cycle through in order, creating a nice variety without random shuffling
const TYPEWRITER_SEQUENCE: (string | number)[] = [
  'hanging.',
  2000,
  'partying.',
  2000,
  'playing.',
  2000,
  'celebrating.',
  2000,
  'exploring.',
  2000,
  'traveling.',
  2000,
  'connecting.',
  2000,
  'bonding.',
  2000,
  'discovering.',
  2000,
  'experiencing.',
  2000,
  'enjoying.',
  2000,
  'living.',
  2000,
  'relaxing.',
  2000,
  'gaming.',
  2000,
  'dancing.',
  2000,
  'hiking.',
  2000,
  'camping.',
  2000,
  'fishing.',
  2000,
  'bowling.',
  2000,
  'golfing.',
  2000,
  'skating.',
  2000,
  'biking.',
  2000,
  'baking.',
  2000,
  'painting.',
  2000,
  'singing.',
  2000,
  'gardening.',
  2000,
  'shopping.',
  2000,
  'climbing.',
  2000,
  'learning.',
  2000,
  'loving.',
  2000,
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, needsOnboarding } = useGlobalUser();

  useEffect(() => {
    // Redirect authenticated users who don't need onboarding to events
    if (!isLoading && isAuthenticated && needsOnboarding === false) {
      router.replace('/events');
    }
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  // Only show loading when user is definitely authenticated and will be redirected
  // Don't show loading for initial auth check - show marketing content immediately
  // This prevents loading flash when tabbing back to the page
  if (isAuthenticated && needsOnboarding === false) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <Icons.spinner className='size-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Background floating logos configuration
  const floatingLogos = [
    // Top area - left side
    {
      color: 'primary' as const,
      size: 'md' as const,
      top: '3%',
      left: '5%',
      rotate: -15,
      delay: 0,
    },
    {
      color: 'warning' as const,
      size: 'sm' as const,
      top: '8%',
      left: '22%',
      rotate: 18,
      delay: 2.2,
    },
    // Top area - center
    {
      color: 'error' as const,
      size: 'sm' as const,
      top: '2%',
      left: '45%',
      rotate: -22,
      delay: 1.4,
    },
    // Top area - right side
    {
      color: 'info' as const,
      size: 'sm' as const,
      top: '6%',
      right: '25%',
      rotate: 20,
      delay: 0.5,
    },
    {
      color: 'success' as const,
      size: 'lg' as const,
      top: '4%',
      right: '8%',
      rotate: -8,
      delay: 1,
    },

    // Upper-mid area
    {
      color: 'warning' as const,
      size: 'sm' as const,
      top: '18%',
      left: '2%',
      rotate: 25,
      delay: 1.5,
    },
    {
      color: 'success' as const,
      size: 'md' as const,
      top: '22%',
      left: '18%',
      rotate: -10,
      delay: 0.7,
    },
    {
      color: 'primary' as const,
      size: 'sm' as const,
      top: '20%',
      left: '38%',
      rotate: 15,
      delay: 2.5,
    },
    {
      color: 'info' as const,
      size: 'sm' as const,
      top: '24%',
      right: '35%',
      rotate: -28,
      delay: 1.8,
    },
    {
      color: 'error' as const,
      size: 'md' as const,
      top: '19%',
      right: '12%',
      rotate: -12,
      delay: 2,
    },
    {
      color: 'warning' as const,
      size: 'lg' as const,
      top: '16%',
      right: '2%',
      rotate: 8,
      delay: 0.3,
    },

    // Mid area
    {
      color: 'info' as const,
      size: 'lg' as const,
      top: '35%',
      left: '3%',
      rotate: 10,
      delay: 0.3,
    },
    {
      color: 'error' as const,
      size: 'sm' as const,
      top: '38%',
      left: '20%',
      rotate: -18,
      delay: 1.9,
    },
    {
      color: 'success' as const,
      size: 'sm' as const,
      top: '42%',
      right: '22%',
      rotate: 22,
      delay: 2.3,
    },
    {
      color: 'primary' as const,
      size: 'sm' as const,
      top: '40%',
      right: '6%',
      rotate: -20,
      delay: 0.8,
    },

    // Lower-mid area
    {
      color: 'success' as const,
      size: 'md' as const,
      top: '52%',
      left: '6%',
      rotate: -5,
      delay: 1.2,
    },
    {
      color: 'primary' as const,
      size: 'sm' as const,
      top: '56%',
      left: '25%',
      rotate: 28,
      delay: 0.4,
    },
    {
      color: 'info' as const,
      size: 'md' as const,
      top: '58%',
      right: '28%',
      rotate: -14,
      delay: 2.1,
    },
    {
      color: 'warning' as const,
      size: 'lg' as const,
      top: '54%',
      right: '4%',
      rotate: 15,
      delay: 1.7,
    },

    // Lower area
    {
      color: 'error' as const,
      size: 'sm' as const,
      top: '68%',
      left: '3%',
      rotate: 30,
      delay: 0.6,
    },
    {
      color: 'warning' as const,
      size: 'md' as const,
      top: '72%',
      left: '15%',
      rotate: -8,
      delay: 1.3,
    },
    {
      color: 'success' as const,
      size: 'sm' as const,
      top: '70%',
      left: '32%',
      rotate: 16,
      delay: 2.4,
    },
    {
      color: 'info' as const,
      size: 'sm' as const,
      top: '74%',
      right: '30%',
      rotate: -24,
      delay: 0.9,
    },
    {
      color: 'primary' as const,
      size: 'md' as const,
      top: '69%',
      right: '8%',
      rotate: -18,
      delay: 1.1,
    },

    // Bottom area
    {
      color: 'warning' as const,
      size: 'sm' as const,
      top: '82%',
      left: '8%',
      rotate: 20,
      delay: 1.6,
    },
    {
      color: 'info' as const,
      size: 'lg' as const,
      top: '85%',
      left: '28%',
      rotate: -12,
      delay: 0.2,
    },
    {
      color: 'error' as const,
      size: 'md' as const,
      top: '88%',
      left: '48%',
      rotate: 25,
      delay: 2.0,
    },
    {
      color: 'primary' as const,
      size: 'sm' as const,
      top: '84%',
      right: '25%',
      rotate: -30,
      delay: 1.0,
    },
    {
      color: 'success' as const,
      size: 'sm' as const,
      top: '90%',
      right: '10%',
      rotate: 12,
      delay: 1.9,
    },
    {
      color: 'warning' as const,
      size: 'md' as const,
      top: '86%',
      right: '2%',
      rotate: -15,
      delay: 0.4,
    },
  ];

  // Show marketing page for unauthenticated users or those needing onboarding
  return (
    <div className='min-h-screen overflow-hidden bg-muted relative'>
      {/* Floating Background Logos */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {floatingLogos.map((logo, i) => (
          <motion.div
            key={i}
            className='absolute opacity-[0.07]'
            style={{
              top: logo.top,
              left: logo.left,
              right: logo.right,
              rotate: logo.rotate,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [logo.rotate, logo.rotate + 5, logo.rotate],
            }}
            transition={{
              duration: 6 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: logo.delay,
            }}
          >
            <LogoSticker
              size={logo.size}
              color={logo.color}
              showArm={i % 4 === 0}
            />
          </motion.div>
        ))}
      </div>

      {/* Hero Section */}
      <section className='relative min-h-[85vh] flex items-center justify-center px-6 py-12 md:py-20'>
        <div className='relative z-base flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-5xl mx-auto'>
          {/* Party Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
            className='relative scale-75 sm:scale-90 md:scale-100'
          >
            {/* People behind the table */}
            <div className='flex items-end justify-center -space-x-6 md:-space-x-8'>
              {/* Friend 1 - waving */}
              <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
              >
                <LogoSticker size='xl' color='success' showArm waving />
              </motion.div>

              {/* Birthday person - party hat! */}
              <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
                className='z-lifted'
              >
                <LogoSticker
                  size='2xl'
                  color='primary'
                  showArm={false}
                  partyHat
                  partyHatColor='warning'
                />
              </motion.div>

              {/* Friend 2 */}
              <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
              >
                <LogoSticker size='xl' color='info' showArm={false} />
              </motion.div>
            </div>

            {/* Table with birthday cake - positioned in front */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, type: 'spring', bounce: 0.4 }}
              className='absolute bottom-0 left-1/2 -translate-x-[30%] z-float'
            >
              <svg
                width='120'
                height='88'
                viewBox='-6 -6 112 94'
                fill='none'
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
              >
                {/* STROKE LAYER - white outlines */}
                <g className='stroke-white' strokeWidth='6' fill='none'>
                  {/* Candle */}
                  <rect x='46' y='10' width='8' height='16' />
                  {/* Flame - drawn after candle so it appears on top */}
                  <path d='M50 0 Q56 6 56 10 Q56 14 50 14 Q44 14 44 10 Q44 6 50 0 Z' />
                  {/* Top layer with scalloped bottom, more rounded top corners */}
                  <path d='M14 26 Q0 26 0 40 L0 44 Q12 52 25 44 Q38 52 50 44 Q62 52 75 44 Q88 52 100 44 L100 40 Q100 26 86 26 Z' />
                  {/* Bottom layer with rounded bottom */}
                  <path d='M0 44 Q12 52 25 44 Q38 52 50 44 Q62 52 75 44 Q88 52 100 44 L100 64 Q100 72 90 72 L10 72 Q0 72 0 64 Z' />
                </g>
                {/* FILL LAYER - covers internal stroke overlaps */}
                {/* Candle */}
                <rect
                  x='46'
                  y='10'
                  width='8'
                  height='16'
                  className='fill-info'
                />
                {/* Flame - drawn after candle so it appears on top */}
                <path
                  d='M50 0 Q56 6 56 10 Q56 14 50 14 Q44 14 44 10 Q44 6 50 0 Z'
                  className='fill-warning'
                />
                {/* Top layer - pink frosting */}
                <path
                  d='M14 26 Q0 26 0 40 L0 44 Q12 52 25 44 Q38 52 50 44 Q62 52 75 44 Q88 52 100 44 L100 40 Q100 26 86 26 Z'
                  className='fill-[#F472B6]'
                />
                {/* Bottom layer - pale peachy cake */}
                <path
                  d='M0 44 Q12 52 25 44 Q38 52 50 44 Q62 52 75 44 Q88 52 100 44 L100 64 Q100 72 90 72 L10 72 Q0 72 0 64 Z'
                  className='fill-[#FDDCAB]'
                />
                {/* Table - stroke then fill */}
                <rect
                  x='-5'
                  y='72'
                  width='110'
                  height='8'
                  rx='2'
                  className='stroke-white fill-muted'
                  strokeWidth='4'
                />
                <rect
                  x='10'
                  y='80'
                  width='8'
                  height='6'
                  rx='1'
                  className='fill-muted'
                />
                <rect
                  x='82'
                  y='80'
                  width='8'
                  height='6'
                  rx='1'
                  className='fill-muted'
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <div className='text-center lg:text-left'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className='mb-6'
            >
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight'>
                Spend less time planning
                <br />
                and more time{' '}
              </h1>
              <TypeAnimation
                preRenderFirstString={true}
                sequence={TYPEWRITER_SEQUENCE}
                speed={50}
                className='text-3xl md:text-4xl lg:text-5xl font-black text-primary leading-tight'
                repeat={Infinity}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='text-lg text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed'
            >
              Groupi helps you find a time that works for everyone. Create an
              event, share a link, and let your friends vote on when
              they&apos;re free. That&apos;s it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='flex flex-col sm:flex-row gap-3 justify-center lg:justify-start'
            >
              <Link href='/create'>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    size='lg'
                    className='text-base px-8 py-6 rounded-card font-bold shadow-raised hover:shadow-floating border-[3px] border-white'
                  >
                    Create an Event
                    <Icons.arrowRight className='ml-2 w-5 h-5' />
                  </Button>
                </motion.div>
              </Link>
              <Link href='/sign-in'>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    size='lg'
                    variant='outline'
                    className='text-base px-8 py-6 rounded-card font-bold bg-card border-2'
                  >
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className='absolute bottom-8 left-1/2 -translate-x-1/2'
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className='flex flex-col items-center gap-1 text-muted-foreground'
          >
            <Icons.down className='size-6' />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className='py-16 px-6'>
        <div className='max-w-2xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-2xl md:text-3xl font-black text-foreground'>
              How it works
            </h2>
          </motion.div>

          <div className='space-y-4'>
            {[
              {
                step: 1,
                title: 'Create your event',
                description:
                  'Give it a name and add a few dates that might work.',
                color: 'primary' as const,
              },
              {
                step: 2,
                title: 'Share the link',
                description: 'Send it to your friends so they can vote.',
                color: 'info' as const,
              },
              {
                step: 3,
                title: 'Pick a winner',
                description:
                  'See which time works for the most people and lock it in.',
                color: 'success' as const,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.3 }}
              >
                <StepItem
                  step={item.step}
                  color={item.color}
                  title={item.title}
                  description={item.description}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for You Section */}
      <section className='py-16 px-6 bg-card/60'>
        <div className='max-w-3xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-2xl md:text-3xl font-black text-foreground mb-3'>
              Built for you, not advertisers
            </h2>
            <p className='text-muted-foreground max-w-xl mx-auto'>
              Groupi is designed around people, not profit. Here&apos;s what
              that means:
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-4'>
            {[
              {
                icon: Icons.heart,
                iconColor: 'error' as const,
                title: '100% free',
                description:
                  'No premium tiers, no feature gates. Everything is available to everyone.',
              },
              {
                icon: Icons.lock,
                iconColor: 'primary' as const,
                title: 'Your data stays yours',
                description:
                  "We don't sell your information or track you across the web. No ads, ever.",
              },
              {
                icon: Icons.code,
                iconColor: 'info' as const,
                title: 'Open source',
                description:
                  'See exactly how it works. Contribute improvements or run your own instance.',
              },
              {
                icon: Icons.people,
                iconColor: 'success' as const,
                title: 'Made by people like you',
                description:
                  'Built because we needed it ourselves, not to hit growth targets.',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.4,
                  type: 'spring',
                  bounce: 0.3,
                }}
                whileHover={{ y: -4 }}
              >
                <StickerCard
                  icon={card.icon}
                  iconColor={card.iconColor}
                  title={card.title}
                  description={card.description}
                  className='hover:shadow-floating transition-shadow'
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-6'>
        <div className='max-w-xl mx-auto text-center'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className='flex items-center justify-center gap-3 mb-3'>
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <LogoSticker size='sm' color='primary' showArm waving />
              </motion.div>
              <h2 className='text-2xl md:text-3xl font-black text-foreground'>
                Ready to try it?
              </h2>
            </div>
            <p className='text-muted-foreground mb-8'>
              Create your first event in under a minute.
            </p>
            <Link href='/create'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='inline-block'
              >
                <Button
                  size='lg'
                  className='text-lg px-10 py-7 rounded-card font-bold shadow-floating hover:shadow-overlay border-[3px] border-white'
                >
                  Create Your Event
                  <Icons.arrowRight className='ml-2 w-5 h-5' />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className='h-16' />
    </div>
  );
}
