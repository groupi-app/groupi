import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { signIn, authClient } from '@/lib/auth-client';
import { LogoSticker } from '@/components/atoms/logo-sticker';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

const RESEND_COOLDOWN_SECONDS = 10;

function DiscordIcon({ size = 20, color = '#5865F2' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </Svg>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastSentIdentifier, setLastSentIdentifier] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
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

  async function handleMagicLink() {
    const value = identifier.trim();
    if (!value) {
      setError('Please enter your email or username');
      return;
    }

    setError('');
    setIsLoading(true);
    setSuccess(false);

    try {
      const isEmail = value.includes('@');

      if (isEmail) {
        const result = await (authClient.signIn as { magicLink: (opts: { email: string; callbackURL: string }) => Promise<{ error?: { message: string } }> }).magicLink({
          email: value,
          callbackURL: '/onboarding',
        });

        if (result.error) {
          setError(result.error.message || 'Failed to send magic link');
        } else {
          setSuccess(true);
          setLastSentIdentifier(value);
          setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        }
      } else {
        // Username - not directly supported by magic link on mobile
        setError('Please enter an email address');
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
    handleMagicLink();
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

      // Step 2: Open the proxy in an in-app browser
      const redirectUrl = Linking.createURL('/');
      const proxyURL = `${baseURL}/api/auth/expo-authorization-proxy?authorizationURL=${encodeURIComponent(data.url)}`;

      console.log('[OAuth] Opening browser...');
      console.log('[OAuth] Proxy URL:', proxyURL.substring(0, 100) + '...');
      console.log('[OAuth] Redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(proxyURL, redirectUrl);

      console.log('[OAuth] Browser result:', result.type);

      if (result.type === 'success') {
        console.log('[OAuth] Success URL:', result.url);
        // Extract cookie from the redirect URL and store it
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
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + title inline */}
        <View className="mb-2 flex-row items-center justify-center gap-3">
          <LogoSticker size={56} waving />
          <Text className="mt-4 text-5xl font-extrabold text-primary">Groupi</Text>
        </View>
        <View className="mb-8 items-center">
          <Text className="text-base text-muted-foreground">
            Plan events together
          </Text>
        </View>

        {/* OAuth buttons */}
        <View className="mb-5 gap-3">
          <Pressable
            className="flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5"
            onPress={() => handleSocialSignIn('discord')}
            disabled={anyLoading}
          >
            {oauthLoading === 'discord' ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <DiscordIcon />
                <Text className="text-base font-medium text-foreground">
                  Continue with Discord
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center gap-3 rounded-button border border-border bg-card py-3.5"
            onPress={() => handleSocialSignIn('google')}
            disabled={anyLoading}
          >
            {oauthLoading === 'google' ? (
              <ActivityIndicator size="small" />
            ) : (
              <>
                <GoogleIcon />
                <Text className="text-base font-medium text-foreground">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View className="mb-5 flex-row items-center">
          <View className="flex-1 border-b border-border" />
          <Text className="mx-3 text-xs uppercase text-muted-foreground">
            Or continue with
          </Text>
          <View className="flex-1 border-b border-border" />
        </View>

        {/* Magic Link */}
        <View className="gap-4">
          <View>
            <Text className="mb-1 text-sm font-medium text-foreground">
              Email
            </Text>
            <TextInput
              className="rounded-input border border-input bg-card px-4 py-3 text-base text-foreground"
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (success && text !== lastSentIdentifier) {
                  setSuccess(false);
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!anyLoading && cooldownSeconds === 0}
            />
          </View>

          {success ? (
            <View className="rounded-card border border-border-success bg-bg-success-subtle p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="mail-outline" size={16} color="#22c55e" />
                <Text className="text-sm font-semibold text-success">
                  Check your email!
                </Text>
              </View>
              <Text className="text-sm text-success">
                We've sent you a magic link to sign in. Tap the link in the
                email to continue.
              </Text>
              {lastSentIdentifier ? (
                <View className="mt-3 border-t border-border-success pt-3">
                  {cooldownSeconds > 0 ? (
                    <Text className="text-sm text-success">
                      Resend available in {cooldownSeconds}s
                    </Text>
                  ) : (
                    <Pressable onPress={handleResend} disabled={isLoading}>
                      <Text className="text-sm font-medium text-success underline">
                        Resend magic link
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          {error ? (
            <Text className="text-sm text-error">{error}</Text>
          ) : null}

          <Pressable
            className="items-center rounded-button bg-primary py-3.5"
            onPress={handleMagicLink}
            disabled={anyLoading || cooldownSeconds > 0}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-primary-foreground">
                {success && identifier === lastSentIdentifier
                  ? 'Link Sent!'
                  : 'Send Magic Link'}
              </Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 items-center">
          <Text className="text-sm text-muted-foreground">
            New users will be automatically registered
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
