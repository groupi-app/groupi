import { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authClient } from '@/lib/auth-client';
import { LogoSticker } from '@/components/atoms/logo-sticker';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const RESEND_COOLDOWN_SECONDS = 30;

function DiscordIcon() {
  return (
    <Svg width={20} height={20} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.947 2.418-2.157 2.418z'
        fill='#5865F2'
      />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'
        fill='#4285F4'
      />
      <Path
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
        fill='#34A853'
      />
      <Path
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
        fill='#FBBC05'
      />
      <Path
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
        fill='#EA4335'
      />
    </Svg>
  );
}

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [lastSentIdentifier, setLastSentIdentifier] = useState<string | null>(
    null
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<TextInput>(null);

  // Session detection is handled by the tabs layout's auth guard.
  // When OTP/OAuth sign-in succeeds, we navigate directly in the handler.

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldownSeconds]);

  async function handleSendCode() {
    const value = identifier.trim();
    if (!value || !value.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);
    setCodeSent(false);

    try {
      // Send both magic link and OTP code simultaneously
      const [otpResult] = await Promise.allSettled([
        authClient.emailOtp.sendVerificationOtp({
          email: value,
          type: 'sign-in',
        }),
        (
          authClient.signIn as {
            magicLink: (opts: {
              email: string;
              callbackURL: string;
            }) => Promise<{ error?: { message: string } }>;
          }
        ).magicLink({
          email: value,
          callbackURL: '/',
        }),
      ]);

      // Check OTP result (primary method)
      const otpError =
        otpResult.status === 'fulfilled'
          ? otpResult.value.error?.message
          : 'Failed to send code';

      if (otpError) {
        setError(otpError);
      } else {
        setCodeSent(true);
        setLastSentIdentifier(value);
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        // Auto-focus OTP input
        setTimeout(() => otpInputRef.current?.focus(), 300);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode() {
    const code = otpCode.trim();
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const baseURL = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

      // Manual fetch to capture ALL set-cookie headers
      // The Better Auth expo client plugin's onSuccess hook only gets the first
      // set-cookie header on React Native, missing convex_jwt and session_data
      const res = await fetch(`${baseURL}/api/auth/sign-in/email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'expo-origin': 'groupi://',
        },
        credentials: 'omit',
        body: JSON.stringify({ email: lastSentIdentifier, otp: code }),
      });

      const data = await res.json();

      if (!res.ok || data.code) {
        setError(data.message || 'Invalid code');
        setOtpCode('');
      } else {
        // Collect ALL set-cookie headers using forEach
        // headers.get() only returns the first one on React Native
        const allCookies: string[] = [];
        res.headers.forEach((value, name) => {
          if (name.toLowerCase() === 'set-cookie') {
            allCookies.push(value);
          }
        });

        // If forEach only gave us one entry, try splitting on known cookie names
        let cookieStrings = allCookies;
        if (
          allCookies.length === 1 &&
          allCookies[0].includes('better-auth.session_data')
        ) {
          // All cookies concatenated in one string - split them
          const raw = allCookies[0];
          cookieStrings = [];
          const parts = raw.split(/(?<=\bLax|None|Strict),\s*/i);
          for (const p of parts) {
            if (p.trim()) cookieStrings.push(p.trim());
          }
        }

        // Parse into the JSON format the expo client expects
        const cookieObj: Record<
          string,
          { value: string; expires: string | null }
        > = {};
        for (const cookie of cookieStrings) {
          const segments = cookie.split(';');
          const first = segments[0]?.trim();
          if (!first) continue;
          const eqIdx = first.indexOf('=');
          if (eqIdx <= 0) continue;

          const name = first.slice(0, eqIdx);
          const value = decodeURIComponent(first.slice(eqIdx + 1));

          let expires: string | null = null;
          for (const seg of segments.slice(1)) {
            const [k, ...v] = seg.split('=');
            if (k.trim().toLowerCase() === 'max-age') {
              const sec = parseInt(v.join('='), 10);
              if (!isNaN(sec))
                expires = new Date(Date.now() + sec * 1000).toISOString();
            }
          }
          cookieObj[name] = { value, expires };
        }

        console.log(
          '[OTP] Storing cookies:',
          Object.keys(cookieObj).join(', ')
        );
        const SecureStore = await import('expo-secure-store');
        await SecureStore.setItemAsync(
          'groupi_cookie',
          JSON.stringify(cookieObj)
        );

        // Also store the session data cache that useSession() reads from
        // The expo client stores this under `${storagePrefix}_session_data`
        const sessionData = {
          session: data,
        };
        await SecureStore.setItemAsync(
          'groupi_session_data',
          JSON.stringify(sessionData)
        );

        console.log(
          '[OTP] Stored cookies and session data, refreshing session...'
        );

        // Force the Better Auth client to re-read cookies from SecureStore
        // and update its internal session state. Without this, useSession()
        // and useConvexAuth() still report unauthenticated.
        await authClient.getSession({
          fetchOptions: { headers: { 'expo-origin': 'groupi://' } },
        });

        router.replace('/(tabs)');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (cooldownSeconds > 0 || !lastSentIdentifier) return;
    setIdentifier(lastSentIdentifier);
    setOtpCode('');
    handleSendCode();
  }

  async function handleSocialSignIn(provider: 'discord' | 'google') {
    setOauthLoading(provider);
    setError('');

    const baseURL = process.env.EXPO_PUBLIC_BETTER_AUTH_URL;
    console.log('[OAuth] Starting', provider);

    try {
      // Step 1: Get the OAuth URL from the server
      console.log('[OAuth] Fetching auth URL...');
      const res = await fetch(`${baseURL}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, callbackURL: '/onboarding' }),
      });
      const data = await res.json();
      console.log('[OAuth] Server response:', JSON.stringify(data));

      if (!data?.url) {
        setError('Could not get auth URL');
        return;
      }

      // Step 2: Open the auth URL in an in-app browser
      const redirectUrl = Linking.createURL('/', { scheme: 'groupi' });
      console.log('[OAuth] Opening browser:', data.url);
      console.log('[OAuth] Redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      console.log('[OAuth] Browser result:', result.type);

      if (result.type === 'success') {
        console.log('[OAuth] Success URL:', result.url);
        const url = new URL(result.url);
        const cookie = url.searchParams.get('cookie');
        if (cookie) {
          console.log('[OAuth] Got cookie, storing...');
          const SecureStore = await import('expo-secure-store');
          await SecureStore.setItemAsync('groupi_cookie', cookie);
        }
        router.replace('/(tabs)');
      } else if (result.type !== 'cancel') {
        setError('Authentication was not completed');
      }
    } catch (e) {
      console.error('[OAuth Error]', provider, e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setOauthLoading(null);
    }
  }

  const anyLoading = isLoading || oauthLoading !== null;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-background'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName='flex-grow justify-center px-6 py-12'
        keyboardShouldPersistTaps='handled'
      >
        {/* Logo + title */}
        <View className='mb-2 flex-row items-center justify-center gap-3'>
          <LogoSticker size={56} waving />
          <Text className='mt-4 text-5xl font-extrabold text-primary'>
            Groupi
          </Text>
        </View>
        <View className='mb-8 items-center'>
          <Text className='text-base text-muted-foreground'>
            Plan events together
          </Text>
        </View>

        {/* OAuth buttons */}
        <View className='mb-5 gap-3'>
          <Pressable
            className='flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5'
            onPress={() => handleSocialSignIn('discord')}
            disabled={anyLoading}
          >
            {oauthLoading === 'discord' ? (
              <ActivityIndicator size='small' />
            ) : (
              <>
                <DiscordIcon />
                <Text className='text-base font-medium text-foreground'>
                  Continue with Discord
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className='flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5'
            onPress={() => handleSocialSignIn('google')}
            disabled={anyLoading}
          >
            {oauthLoading === 'google' ? (
              <ActivityIndicator size='small' />
            ) : (
              <>
                <GoogleIcon />
                <Text className='text-base font-medium text-foreground'>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View className='mb-5 flex-row items-center'>
          <View className='flex-1 border-b border-border' />
          <Text className='mx-3 text-xs uppercase text-muted-foreground'>
            Or continue with
          </Text>
          <View className='flex-1 border-b border-border' />
        </View>

        {/* Email + OTP */}
        <View className='gap-4'>
          <View>
            <Text className='mb-1 text-sm font-medium text-foreground'>
              Email
            </Text>
            <TextInput
              className='rounded-input border border-input bg-card px-4 py-3 text-base text-foreground'
              placeholder='you@example.com'
              placeholderTextColor='#9ca3af'
              value={identifier}
              onChangeText={text => {
                setIdentifier(text);
                if (codeSent && text !== lastSentIdentifier) {
                  setCodeSent(false);
                  setOtpCode('');
                }
              }}
              autoCapitalize='none'
              keyboardType='email-address'
              autoComplete='email'
              editable={!anyLoading}
            />
          </View>

          {codeSent ? (
            <>
              {/* OTP Code Input */}
              <View>
                <Text className='mb-1 text-sm font-medium text-foreground'>
                  Verification Code
                </Text>
                <TextInput
                  ref={otpInputRef}
                  className='rounded-input border border-input bg-card px-4 py-3 text-center text-2xl font-bold tracking-[8px] text-foreground'
                  placeholder='000000'
                  placeholderTextColor='#9ca3af'
                  value={otpCode}
                  onChangeText={text => {
                    const digits = text.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(digits);
                  }}
                  keyboardType='number-pad'
                  maxLength={6}
                  editable={!anyLoading}
                  autoFocus
                />
              </View>

              {/* Success message */}
              <View className='rounded-card border border-border-success bg-bg-success-subtle p-4'>
                <View className='mb-2 flex-row items-center gap-2'>
                  <Ionicons name='mail-outline' size={16} color='#22c55e' />
                  <Text className='text-sm font-semibold text-success'>
                    Check your email!
                  </Text>
                </View>
                <Text className='text-sm text-success'>
                  We sent a 6-digit code and a magic link to{' '}
                  {lastSentIdentifier}. Enter the code above or tap the link.
                </Text>
                <View className='mt-3 border-t border-border-success pt-3'>
                  {cooldownSeconds > 0 ? (
                    <Text className='text-sm text-success'>
                      Resend available in {cooldownSeconds}s
                    </Text>
                  ) : (
                    <Pressable onPress={handleResend} disabled={isLoading}>
                      <Text className='text-sm font-medium text-success underline'>
                        Resend code
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Verify button */}
              <Pressable
                className='items-center rounded-button bg-primary py-3.5'
                onPress={handleVerifyCode}
                disabled={anyLoading || otpCode.length !== 6}
              >
                {isLoading ? (
                  <ActivityIndicator color='white' />
                ) : (
                  <Text className='text-base font-semibold text-primary-foreground'>
                    Verify Code
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {error ? (
                <Text className='text-sm text-error'>{error}</Text>
              ) : null}

              {/* Send code button */}
              <Pressable
                className='items-center rounded-button bg-primary py-3.5'
                onPress={handleSendCode}
                disabled={anyLoading || cooldownSeconds > 0}
              >
                {isLoading ? (
                  <ActivityIndicator color='white' />
                ) : (
                  <Text className='text-base font-semibold text-primary-foreground'>
                    Continue with Email
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {codeSent && error ? (
            <Text className='text-sm text-error'>{error}</Text>
          ) : null}
        </View>

        <View className='mt-6 items-center'>
          <Text className='text-sm text-muted-foreground'>
            New users will be automatically registered
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
