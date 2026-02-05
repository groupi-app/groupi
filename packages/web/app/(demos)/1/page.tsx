'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * Demo 1: "Sticker Shelf"
 *
 * Clean, organized sticker collection. White borders create that
 * die-cut sticker look. Warm background, playful but refined.
 * Tape accents on logo for handmade touch.
 */

// Tape strip decoration
function Tape({
  color = 'bg-warning/70',
  rotate = 0,
  className = '',
}: {
  color?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={`h-4 w-14 ${color} rounded-sm ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    />
  );
}

// Sticker-style card with white border effect
function StickerCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, type: 'spring', bounce: 0.3 }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-card p-5 shadow-raised hover:shadow-floating transition-shadow border-2 border-white outline outline-1 outline-border ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Icon with sticker border
function StickerIcon({
  icon: Icon,
  color,
  size = 'md',
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`${sizes[size]} ${color} rounded-card flex items-center justify-center shadow-raised border-3 border-white`}
    >
      <Icon className={`${iconSizes[size]} text-white`} />
    </motion.div>
  );
}

// Mini sticker badge
function MiniBadge({
  icon: Icon,
  label,
  color,
  delay = 0,
  rotate = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  delay?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', bounce: 0.5 }}
      whileHover={{ scale: 1.1, rotate: rotate + 3 }}
      style={{ rotate }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${color} rounded-badge text-white text-xs font-bold shadow-raised border-2 border-white`}
    >
      <Icon className='w-3.5 h-3.5' />
      {label}
    </motion.div>
  );
}

// Step number sticker
function StepSticker({
  num,
  color,
  delay = 0,
}: {
  num: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', bounce: 0.5 }}
      whileHover={{ scale: 1.1 }}
      className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-lg font-bold text-white shadow-raised border-2 border-white flex-shrink-0`}
    >
      {num}
    </motion.div>
  );
}

export default function Demo1() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -30]);

  const features = [
    {
      icon: Icons.date,
      title: 'Date Voting',
      desc: 'Everyone picks when works best',
      color: 'bg-primary',
    },
    {
      icon: Icons.people,
      title: 'Squad Builder',
      desc: 'Watch your crew come together',
      color: 'bg-info',
    },
    {
      icon: Icons.messageSquare,
      title: 'Group Chat',
      desc: 'Plan together in one place',
      color: 'bg-success',
    },
    {
      icon: Icons.bell,
      title: 'Smart Pings',
      desc: 'Stay in the loop on updates',
      color: 'bg-warning',
    },
  ];

  return (
    <div
      ref={containerRef}
      className='min-h-screen overflow-hidden'
      style={{
        background:
          'linear-gradient(180deg, hsl(48, 100%, 97%) 0%, hsl(40, 60%, 95%) 100%)',
      }}
    >
      {/* Hero Section */}
      <section className='relative min-h-[90vh] flex items-center justify-center px-6 py-20'>
        <motion.div
          style={{ y: heroY }}
          className='relative z-10 text-center max-w-4xl mx-auto'
        >
          {/* Logo with tape */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            className='relative w-24 h-24 mx-auto mb-10'
          >
            <Tape
              className='absolute -top-1.5 left-1/2 -translate-x-1/2 z-10'
              rotate={-4}
            />
            <Tape
              className='absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10'
              rotate={3}
              color='bg-info/70'
            />
            <motion.div
              whileHover={{ scale: 1.05 }}
              className='w-full h-full bg-primary rounded-card flex items-center justify-center shadow-floating border-4 border-white'
            >
              <Icons.logo className='w-12 h-12 text-white' />
            </motion.div>
          </motion.div>

          {/* Beta sticker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-badge bg-success text-white font-bold text-sm mb-8 shadow-raised border-2 border-white'
          >
            <Icons.sparkles className='w-4 h-4' />
            Free Forever
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className='text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight'
          >
            Making plans
            <br />
            <span className='text-primary'>should be fun</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed'
          >
            Create an event, invite your friends, and find the perfect time to
            hang out. No more endless group chat debates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className='flex flex-col sm:flex-row gap-3 justify-center'
          >
            <Link href='/create'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size='lg'
                  className='text-base px-7 py-5 rounded-card font-bold shadow-raised hover:shadow-floating border-2 border-white'
                >
                  Get Started
                  <Icons.arrowRight className='ml-2 w-4 h-4' />
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
                  className='text-base px-7 py-5 rounded-card font-bold bg-white/80 border-2'
                >
                  Sign In
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Mini badge stickers */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className='flex flex-wrap justify-center gap-2 mt-12'
          >
            <MiniBadge
              icon={Icons.check}
              label='Easy'
              color='bg-success'
              delay={0.9}
              rotate={-4}
            />
            <MiniBadge
              icon={Icons.time}
              label='Fast'
              color='bg-warning'
              delay={1.0}
              rotate={2}
            />
            <MiniBadge
              icon={Icons.party}
              label='Fun'
              color='bg-error'
              delay={1.1}
              rotate={-2}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className='py-20 px-6'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-14'
          >
            <h2 className='text-3xl md:text-4xl font-black text-foreground mb-3'>
              Your Planning Toolkit
            </h2>
            <p className='text-lg text-muted-foreground'>
              Simple tools that make group planning actually enjoyable
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-4'>
            {features.map((feature, i) => (
              <StickerCard key={i} delay={i * 0.08}>
                <div className='flex items-start gap-4'>
                  <StickerIcon icon={feature.icon} color={feature.color} />
                  <div>
                    <h3 className='text-lg font-bold text-foreground mb-0.5'>
                      {feature.title}
                    </h3>
                    <p className='text-muted-foreground text-sm'>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </StickerCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 px-6 bg-white/50'>
        <div className='max-w-2xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-14'
          >
            <h2 className='text-3xl md:text-4xl font-black text-foreground mb-3'>
              How It Works
            </h2>
          </motion.div>

          <div className='space-y-6'>
            {[
              {
                num: '1',
                title: 'Create an event',
                desc: 'Give it a name and add some date options',
                color: 'bg-primary',
              },
              {
                num: '2',
                title: 'Share with friends',
                desc: 'Send the link - no signup needed to join',
                color: 'bg-info',
              },
              {
                num: '3',
                title: 'Pick the best time',
                desc: 'Everyone votes and the winner is clear',
                color: 'bg-success',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.3 }}
                className='flex items-start gap-4'
              >
                <StepSticker
                  num={step.num}
                  color={step.color}
                  delay={i * 0.1}
                />
                <div className='pt-1'>
                  <h3 className='text-base font-bold text-foreground mb-0.5'>
                    {step.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className='py-14 px-6'>
        <div className='max-w-3xl mx-auto'>
          <StickerCard className='!p-8'>
            <div className='flex flex-wrap justify-center gap-10'>
              {[
                { value: '10K+', label: 'Events' },
                { value: '50K+', label: 'Users' },
                { value: '100%', label: 'Free' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: 'spring', bounce: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  className='text-center'
                >
                  <div className='text-4xl font-black text-primary mb-1'>
                    {stat.value}
                  </div>
                  <div className='text-sm font-medium text-muted-foreground'>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </StickerCard>
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
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='inline-block mb-5'
            >
              <StickerIcon icon={Icons.sparkles} color='bg-warning' size='lg' />
            </motion.div>
            <h2 className='text-2xl md:text-3xl font-black text-foreground mb-3'>
              Ready to try?
            </h2>
            <p className='text-lg text-muted-foreground mb-7'>
              Create your first event in seconds
            </p>
            <Link href='/create'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='inline-block'
              >
                <Button
                  size='lg'
                  className='text-lg px-8 py-6 rounded-card font-bold shadow-floating hover:shadow-overlay border-2 border-white'
                >
                  Create Event
                  <Icons.arrowRight className='ml-2 w-5 h-5' />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer spacer */}
      <div className='h-20' />

      {/* Demo navigation */}
      <div className='fixed bottom-6 right-6 z-50 flex gap-2'>
        {[1, 2, 3, 4].map(num => (
          <Link key={num} href={`/${num}`}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size='sm'
                className={`rounded-card font-bold border-2 border-white ${
                  num === 1
                    ? 'bg-primary text-white shadow-floating'
                    : 'bg-white text-foreground shadow-raised'
                }`}
              >
                {num}
              </Button>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
