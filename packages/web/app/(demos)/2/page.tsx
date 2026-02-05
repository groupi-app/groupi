'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * Demo 2: "Fresh Stickers"
 *
 * Bright, fresh take on sticker aesthetic. Cool-toned background
 * with white-bordered elements. Clean and energetic feel.
 * Slightly larger elements for a bolder presence.
 */

// Sticker card with prominent white border
function FreshCard({
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
      whileHover={{ y: -6 }}
      className={`bg-white rounded-card p-6 shadow-raised hover:shadow-floating transition-shadow border-2 border-white ring-1 ring-border/50 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Bold sticker icon
function BoldIcon({
  icon: Icon,
  color,
  size = 'md',
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-11 h-11',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
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

// Sticker pill badge
function PillBadge({
  icon: Icon,
  label,
  color,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', bounce: 0.5 }}
      whileHover={{ scale: 1.08 }}
      className={`inline-flex items-center gap-2 px-4 py-2 ${color} rounded-badge text-white text-sm font-bold shadow-raised border-2 border-white`}
    >
      <Icon className='w-4 h-4' />
      {label}
    </motion.div>
  );
}

// Number badge
function NumBadge({
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
      className={`w-11 h-11 ${color} rounded-full flex items-center justify-center text-lg font-black text-white shadow-raised border-2 border-white flex-shrink-0`}
    >
      {num}
    </motion.div>
  );
}

export default function Demo2() {
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
      title: 'Pick Dates Together',
      desc: 'Vote on when works best for everyone',
      color: 'bg-primary',
    },
    {
      icon: Icons.people,
      title: 'Build Your Crew',
      desc: 'See friends join in real-time',
      color: 'bg-info',
    },
    {
      icon: Icons.messageSquare,
      title: 'Chat as You Plan',
      desc: 'Keep discussions in one place',
      color: 'bg-success',
    },
    {
      icon: Icons.bell,
      title: 'Get Notified',
      desc: 'Know when things are happening',
      color: 'bg-warning',
    },
  ];

  return (
    <div
      ref={containerRef}
      className='min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50'
    >
      {/* Hero Section */}
      <section className='relative min-h-[90vh] flex items-center justify-center px-6 py-20'>
        <motion.div
          style={{ y: heroY }}
          className='relative z-10 text-center max-w-4xl mx-auto'
        >
          {/* Logo sticker */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            className='relative w-26 h-26 mx-auto mb-10'
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className='w-24 h-24 bg-primary rounded-card flex items-center justify-center shadow-floating border-4 border-white'
            >
              <Icons.logo className='w-12 h-12 text-white' />
            </motion.div>
          </motion.div>

          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='inline-flex items-center gap-2 px-5 py-2 rounded-badge bg-success text-white font-bold text-sm mb-8 shadow-raised border-2 border-white'
          >
            <Icons.sparkles className='w-4 h-4' />
            Always Free
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className='text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight'
          >
            Finally, planning
            <br />
            <span className='text-primary'>that works</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed'
          >
            Bring your friends together without the chaos. Create events, vote
            on times, and make plans that actually happen.
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
                  className='text-base px-8 py-6 rounded-card font-bold shadow-raised hover:shadow-floating border-2 border-white'
                >
                  Start Planning
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
                  className='text-base px-8 py-6 rounded-card font-bold bg-white border-2'
                >
                  Sign In
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className='flex flex-wrap justify-center gap-3 mt-12'
          >
            <PillBadge
              icon={Icons.check}
              label='Simple'
              color='bg-success'
              delay={0.9}
            />
            <PillBadge
              icon={Icons.time}
              label='Quick'
              color='bg-info'
              delay={1.0}
            />
            <PillBadge
              icon={Icons.party}
              label='Fun'
              color='bg-warning'
              delay={1.1}
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
              Everything You Need
            </h2>
            <p className='text-lg text-muted-foreground'>
              Simple features for seamless group planning
            </p>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-5'>
            {features.map((feature, i) => (
              <FreshCard key={i} delay={i * 0.08}>
                <div className='flex items-start gap-4'>
                  <BoldIcon icon={feature.icon} color={feature.color} />
                  <div>
                    <h3 className='text-lg font-bold text-foreground mb-1'>
                      {feature.title}
                    </h3>
                    <p className='text-muted-foreground text-sm'>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </FreshCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 px-6 bg-white/60'>
        <div className='max-w-2xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='text-center mb-14'
          >
            <h2 className='text-3xl md:text-4xl font-black text-foreground mb-3'>
              Three Easy Steps
            </h2>
          </motion.div>

          <div className='space-y-5'>
            {[
              {
                num: '1',
                title: 'Create your event',
                desc: 'Name it and add possible dates',
                color: 'bg-primary',
              },
              {
                num: '2',
                title: 'Invite everyone',
                desc: 'Share the link - no account needed',
                color: 'bg-info',
              },
              {
                num: '3',
                title: 'Vote and go',
                desc: 'Pick the winning time together',
                color: 'bg-success',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.3 }}
                className='flex items-center gap-4 bg-white rounded-card p-4 shadow-raised border-2 border-white ring-1 ring-border/30'
              >
                <NumBadge num={step.num} color={step.color} delay={i * 0.1} />
                <div>
                  <h3 className='text-base font-bold text-foreground'>
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
          <FreshCard className='!p-8'>
            <div className='flex flex-wrap justify-center gap-12'>
              {[
                { value: '10K+', label: 'Events Created' },
                { value: '50K+', label: 'Happy Planners' },
                { value: '100%', label: 'Free Forever' },
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
          </FreshCard>
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
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='inline-block mb-5'
            >
              <BoldIcon icon={Icons.sparkles} color='bg-warning' size='md' />
            </motion.div>
            <h2 className='text-2xl md:text-3xl font-black text-foreground mb-3'>
              Ready to get started?
            </h2>
            <p className='text-lg text-muted-foreground mb-7'>
              Your next hangout is just a few clicks away
            </p>
            <Link href='/create'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='inline-block'
              >
                <Button
                  size='lg'
                  className='text-lg px-10 py-7 rounded-card font-bold shadow-floating hover:shadow-overlay border-2 border-white'
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
      <div className='h-20' />

      {/* Demo navigation */}
      <div className='fixed bottom-6 right-6 z-50 flex gap-2'>
        {[1, 2, 3, 4].map(num => (
          <Link key={num} href={`/${num}`}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size='sm'
                className={`rounded-card font-bold border-2 border-white ${
                  num === 2
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
