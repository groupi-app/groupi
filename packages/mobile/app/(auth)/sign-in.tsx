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
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LogoSticker } from '@/components/atoms/logo-sticker';
import { Ionicons } from '@expo/vector-icons';
import { getSafeAuthReturnPath } from '@/lib/auth-route-policy';
import { getNativeAuthCallbackPath } from '@/lib/native-auth';
import { authClient } from '@/lib/auth-client';
import {
  requestNativeSignIn,
  signInWithNativeSocial,
  verifyNativeEmailOtp,
} from '@/lib/native-auth-actions';
import { isNativePasskeyAvailable } from '@/lib/native-passkey-client';
import {
  getPasskeyErrorMessage,
  isPasskeyCancellation,
} from '@/lib/passkey-errors';
import { useCSSVariable } from 'uniwind';

WebBrowser.maybeCompleteAuthSession();

const RESEND_COOLDOWN_SECONDS = 30;

function DiscordIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M20.317 4.369a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.947 2.418-2.157 2.418z'
        fill={color}
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
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [lastSentIdentifier, setLastSentIdentifier] = useState<string | null>(
    null
  );
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<TextInput>(null);
  const authDestination = (getSafeAuthReturnPath(returnTo) ??
    '/(tabs)') as Href;
  const passkeyAvailable = isNativePasskeyAvailable();
  const foregroundColor = useCSSVariable('--color-foreground') as
    | string
    | undefined;

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
    if (!value) {
      setError('Please enter your email or username');
      return;
    }

    setError('');
    setIsLoading(true);
    setCodeSent(false);

    try {
      const result = await requestNativeSignIn(
        value,
        getNativeAuthCallbackPath(returnTo)
      );

      if (!result.success) {
        setError(result.message);
      } else {
        setCodeSent(true);
        setLastSentIdentifier(value);
        setLastSentEmail(result.email);
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
      if (!lastSentEmail) {
        setError('Request a new code and try again');
        return;
      }

      const result = await verifyNativeEmailOtp(lastSentEmail, code);

      if (!result.success) {
        setError(result.message);
        setOtpCode('');
      } else {
        router.replace(authDestination);
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

    try {
      const result = await signInWithNativeSocial(
        provider,
        getNativeAuthCallbackPath(returnTo)
      );

      if (!result.success) {
        setError(result.message);
      } else {
        router.replace(authDestination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setOauthLoading(null);
    }
  }

  async function handlePasskeySignIn() {
    if (!passkeyAvailable) return;

    setPasskeyLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.passkey();

      if (result.error) {
        if (!isPasskeyCancellation(result.error)) {
          setError(
            getPasskeyErrorMessage(result.error, 'Passkey sign-in failed')
          );
        }
        return;
      }

      router.replace(authDestination);
    } catch (passkeyError) {
      if (!isPasskeyCancellation(passkeyError)) {
        setError(
          getPasskeyErrorMessage(passkeyError, 'Passkey sign-in failed')
        );
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  const anyLoading = isLoading || oauthLoading !== null || passkeyLoading;

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-background'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName='flex-grow justify-center px-6 py-12'
        keyboardShouldPersistTaps='handled'
      >
        {/* Brand + welcome */}
        <View className='mb-1 flex-row items-center justify-center gap-2'>
          <LogoSticker size={44} waving />
          <Text className='mt-3 text-4xl font-extrabold text-primary'>
            Groupi
          </Text>
        </View>
        <View className='mb-7 items-center gap-1'>
          <Text className='text-2xl font-bold text-foreground'>
            Welcome back
          </Text>
          <Text className='text-base text-muted-foreground'>
            Plan events together
          </Text>
        </View>

        {/* OAuth buttons */}
        <View className='mb-5 gap-3'>
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Continue with Discord'
            className='flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5 active:opacity-80 disabled:opacity-50'
            onPress={() => handleSocialSignIn('discord')}
            disabled={anyLoading}
          >
            {oauthLoading === 'discord' ? (
              <ActivityIndicator size='small' />
            ) : (
              <>
                <DiscordIcon color={foregroundColor ?? '#111827'} />
                <Text className='text-base font-medium text-foreground'>
                  Continue with Discord
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Continue with Google'
            className='flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5 active:opacity-80 disabled:opacity-50'
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

          {passkeyAvailable ? (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Continue with a passkey'
              className='flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5 active:opacity-80 disabled:opacity-50'
              onPress={handlePasskeySignIn}
              disabled={anyLoading}
            >
              {passkeyLoading ? (
                <View className='flex-row items-center gap-3'>
                  <ActivityIndicator size='small' />
                  <Text className='text-base font-medium text-foreground'>
                    Checking passkey…
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons
                    name='key-outline'
                    size={20}
                    color={foregroundColor ?? '#111827'}
                  />
                  <Text className='text-base font-medium text-foreground'>
                    Continue with a passkey
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>

        {/* Divider */}
        <View className='mb-5 flex-row items-center'>
          <View className='flex-1 border-b border-border' />
          <Text className='mx-3 text-xs uppercase text-muted-foreground'>
            Or use email
          </Text>
          <View className='flex-1 border-b border-border' />
        </View>

        {/* Email + OTP */}
        <View className='gap-4'>
          <View>
            <Text className='mb-1 text-sm font-medium text-foreground'>
              Email or username
            </Text>
            <TextInput
              className='rounded-input border border-input bg-card px-4 py-3 text-base text-foreground'
              placeholder='Enter your email or username'
              placeholderTextColorClassName='accent-muted-foreground'
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
              autoComplete='username'
              editable={!anyLoading}
            />
          </View>

          {codeSent ? (
            <>
              {/* OTP Code Input */}
              <View>
                <Text className='mb-1 text-sm font-medium text-foreground'>
                  Verification code
                </Text>
                <TextInput
                  ref={otpInputRef}
                  className='rounded-input border border-input bg-card px-4 py-3 text-center text-2xl font-bold tracking-[8px] text-foreground'
                  placeholder='000000'
                  placeholderTextColorClassName='accent-muted-foreground'
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
                  <Text className='text-sm font-semibold text-text-success'>
                    Check your email
                  </Text>
                </View>
                <Text className='text-sm text-text-success'>
                  We sent a 6-digit code and a sign-in link to{' '}
                  {lastSentIdentifier}. Enter the code above or open the link.
                </Text>
                <View className='mt-3 border-t border-border-success pt-3'>
                  {cooldownSeconds > 0 ? (
                    <Text className='text-sm text-text-success'>
                      Resend available in {cooldownSeconds}s
                    </Text>
                  ) : (
                    <Pressable onPress={handleResend} disabled={isLoading}>
                      <Text className='text-sm font-medium text-text-success underline'>
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
                    Verify code
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {error ? (
                <Text className='text-sm text-text-error'>{error}</Text>
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
                    Continue with email
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {codeSent && error ? (
            <Text className='text-sm text-text-error'>{error}</Text>
          ) : null}
        </View>

        <View className='mt-6 items-center'>
          <Text className='text-sm text-muted-foreground'>
            New to Groupi? We’ll create an account automatically.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
