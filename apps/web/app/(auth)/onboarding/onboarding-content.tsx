'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { checkUsernameAvailabilityAction } from '@/actions/account-actions';
import { completeOnboardingAction } from '@/actions/onboarding-actions';
import { toast } from 'sonner';

export function OnboardingContent() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.trim() === '') {
      setAvailabilityStatus('idle');
      return;
    }

    setAvailabilityStatus('checking');

    try {
      const [error, data] = await checkUsernameAvailabilityAction({
        username: value.trim(),
      });

      if (error) {
        setAvailabilityStatus('taken');
        return;
      }

      if (data?.available) {
        setAvailabilityStatus('available');
      } else {
        setAvailabilityStatus('taken');
      }
    } catch {
      setAvailabilityStatus('taken');
    }
  }, []);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    const timer = setTimeout(() => {
      if (username) {
        checkAvailability(username);
      } else {
        setAvailabilityStatus('idle');
      }
    }, 500); // 500ms debounce

    debounceTimerRef.current = timer;

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [username, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (availabilityStatus === 'taken' || availabilityStatus === 'checking') {
      toast.error('Please choose an available username');
      return;
    }

    setLoading(true);

    try {
      const [error] = await completeOnboardingAction({
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      if (error) {
        toast.error('Failed to complete onboarding. Please try again.');
        return;
      }

      toast.success('Welcome to Groupi!');
      router.push('/events');
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container py-24'>
      <div className='flex justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Welcome to Groupi!</CardTitle>
            <CardDescription>
              Let&apos;s set up your profile. You can always change these later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Username Field */}
              <div>
                <Label htmlFor='username'>Username *</Label>
                <div className='relative mt-1'>
                  <Input
                    id='username'
                    type='text'
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder='Choose a username'
                    required
                    disabled={loading}
                    className='pr-10'
                    pattern='[a-zA-Z0-9_-]+'
                    title='Username can only contain letters, numbers, underscores, and hyphens'
                  />
                  {availabilityStatus === 'checking' && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <Icons.spinner className='size-4 animate-spin text-muted-foreground' />
                    </div>
                  )}
                  {availabilityStatus === 'available' && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <Icons.check className='size-4 text-green-600' />
                    </div>
                  )}
                  {availabilityStatus === 'taken' && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <Icons.close className='size-4 text-red-600' />
                    </div>
                  )}
                </div>
                {availabilityStatus === 'available' && (
                  <p className='text-sm text-green-600 mt-1'>
                    Username is available
                  </p>
                )}
                {availabilityStatus === 'taken' && (
                  <p className='text-sm text-red-600 mt-1'>
                    Username is already taken
                  </p>
                )}
                <p className='text-sm text-muted-foreground mt-1'>
                  Username can only contain letters, numbers, underscores, and
                  hyphens
                </p>
              </div>

              {/* Display Name Field */}
              <div>
                <Label htmlFor='displayName'>Display Name</Label>
                <Input
                  id='displayName'
                  type='text'
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder='Your display name (optional)'
                  disabled={loading}
                />
                <p className='text-sm text-muted-foreground mt-1'>
                  This is how your name will appear to others
                </p>
              </div>

              {/* Pronouns Field */}
              <div>
                <Label htmlFor='pronouns'>Pronouns</Label>
                <Input
                  id='pronouns'
                  type='text'
                  value={pronouns}
                  onChange={e => setPronouns(e.target.value)}
                  placeholder='e.g., she/her, he/him, they/them'
                  disabled={loading}
                />
                <p className='text-sm text-muted-foreground mt-1'>
                  Optional - helps others refer to you correctly
                </p>
              </div>

              {/* Bio Field */}
              <div>
                <Label htmlFor='bio'>Bio</Label>
                <Textarea
                  id='bio'
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder='Tell us about yourself...'
                  rows={3}
                  disabled={loading}
                  className='resize-none'
                />
                <p className='text-sm text-muted-foreground mt-1'>
                  Optional - share a bit about yourself
                </p>
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={
                  loading ||
                  !username.trim() ||
                  availabilityStatus === 'checking' ||
                  availabilityStatus === 'taken'
                }
              >
                {loading ? (
                  <>
                    <Icons.spinner className='size-4 mr-2 animate-spin' />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
