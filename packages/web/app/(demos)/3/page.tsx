'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * Demo 3: "Sticker Journal"
 *
 * People-first marketing page. Warm, approachable, and honest.
 * Focuses on user benefits without marketing fluff.
 * Emphasizes: free, open source, no ads, no data selling.
 */

// Card with white sticker border
function Card({
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
      whileHover={{ y: -4 }}
      className={`bg-white rounded-card p-6 shadow-raised hover:shadow-floating transition-shadow border-3 border-white ring-1 ring-border/40 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Icon with white border
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
    lg: 'w-14 h-14',
  };
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`${sizes[size]} ${color} rounded-card flex items-center justify-center shadow-raised border-4 border-white`}
    >
      <Icon className={`${iconSizes[size]} text-white`} />
    </motion.div>
  );
}

// Step number
function StepNumber({
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
      className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-lg font-black text-white shadow-raised border-3 border-white flex-shrink-0`}
    >
      {num}
    </motion.div>
  );
}

export default function Demo3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -30]);

  return (
    <div
      ref={containerRef}
      className='min-h-screen overflow-hidden'
      style={{
        background:
          'linear-gradient(180deg, hsl(35, 60%, 97%) 0%, hsl(30, 40%, 94%) 100%)',
      }}
    >
      {/* Hero Section */}
      <section className='relative min-h-[85vh] flex items-center justify-center px-6 py-20'>
        <motion.div
          style={{ y: heroY }}
          className='relative z-10 text-center max-w-3xl mx-auto'
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            className='relative w-24 h-24 mx-auto mb-8'
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className='w-full h-full bg-primary rounded-card flex items-center justify-center shadow-floating border-4 border-white'
            >
              <Icons.logo className='w-12 h-12 text-white' />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className='text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight'
          >
            Planning hangouts
            <br />
            <span className='text-primary'>shouldn&apos;t be hard</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed'
          >
            Groupi helps you find a time that works for everyone. Create an
            event, share a link, and let your friends vote on when they&apos;re
            free. That&apos;s it.
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
                  className='text-base px-8 py-6 rounded-card font-bold shadow-raised hover:shadow-floating border-3 border-white'
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
                  className='text-base px-8 py-6 rounded-card font-bold bg-white border-2'
                >
                  Sign In
                </Button>
              </motion.div>
            </Link>
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
                num: '1',
                title: 'Create your event',
                desc: 'Give it a name and add a few dates that might work.',
                color: 'bg-primary',
              },
              {
                num: '2',
                title: 'Share the link',
                desc: 'Send it to your friends. They don\u2019t need an account to vote.',
                color: 'bg-info',
              },
              {
                num: '3',
                title: 'Pick a winner',
                desc: 'See which time works for the most people and lock it in.',
                color: 'bg-success',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.3 }}
                className='flex items-start gap-4 bg-white rounded-card p-5 shadow-raised border-3 border-white ring-1 ring-border/30'
              >
                <StepNumber num={step.num} color={step.color} delay={i * 0.1} />
                <div className='pt-0.5'>
                  <h3 className='text-base font-bold text-foreground mb-1'>
                    {step.title}
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for You Section */}
      <section className='py-16 px-6 bg-white/60'>
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
            <Card delay={0}>
              <div className='flex items-start gap-4'>
                <StickerIcon icon={Icons.heart} color='bg-error' />
                <div>
                  <h3 className='text-base font-bold text-foreground mb-1'>
                    100% free
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    No premium tiers, no feature gates. Everything is available
                    to everyone.
                  </p>
                </div>
              </div>
            </Card>

            <Card delay={0.08}>
              <div className='flex items-start gap-4'>
                <StickerIcon icon={Icons.lock} color='bg-primary' />
                <div>
                  <h3 className='text-base font-bold text-foreground mb-1'>
                    Your data stays yours
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    We don&apos;t sell your information or track you across the
                    web. No ads, ever.
                  </p>
                </div>
              </div>
            </Card>

            <Card delay={0.16}>
              <div className='flex items-start gap-4'>
                <StickerIcon icon={Icons.code} color='bg-info' />
                <div>
                  <h3 className='text-base font-bold text-foreground mb-1'>
                    Open source
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    See exactly how it works. Contribute improvements or run
                    your own instance.
                  </p>
                </div>
              </div>
            </Card>

            <Card delay={0.24}>
              <div className='flex items-start gap-4'>
                <StickerIcon icon={Icons.people} color='bg-success' />
                <div>
                  <h3 className='text-base font-bold text-foreground mb-1'>
                    Made by people like you
                  </h3>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    Built because we needed it ourselves, not to hit growth
                    targets.
                  </p>
                </div>
              </div>
            </Card>
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
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className='inline-block mb-5'
            >
              <StickerIcon icon={Icons.sparkles} color='bg-warning' size='lg' />
            </motion.div>
            <h2 className='text-2xl md:text-3xl font-black text-foreground mb-3'>
              Ready to try it?
            </h2>
            <p className='text-muted-foreground mb-8'>
              Create your first event in under a minute. No signup required to
              get started.
            </p>
            <Link href='/create'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='inline-block'
              >
                <Button
                  size='lg'
                  className='text-lg px-10 py-7 rounded-card font-bold shadow-floating hover:shadow-overlay border-3 border-white'
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

      {/* Demo navigation */}
      <div className='fixed bottom-6 right-6 z-50 flex gap-2'>
        {[1, 2, 3, 4].map(num => (
          <Link key={num} href={`/${num}`}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size='sm'
                className={`rounded-card font-bold border-2 border-white ${
                  num === 3
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
