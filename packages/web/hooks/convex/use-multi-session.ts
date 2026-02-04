'use client';

import { useCallback, useEffect, useState } from 'react';
import { authClient, useSession } from '@/lib/auth-client';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export interface DeviceSession {
  token: string;
  userId: string;
  userImage?: string | null;
  userName?: string | null;
  userEmail: string;
  isActive: boolean;
}

// Type for the session data returned by Better Auth multiSession plugin
interface MultiSessionData {
  token: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  session?: {
    token: string;
  } | null;
}

// Access multiSession methods via typed extension
// Better Auth plugin types aren't properly inferred, so we use type assertion
const multiSession = authClient as unknown as {
  multiSession: {
    listDeviceSessions: (params: object) => Promise<{
      data?: MultiSessionData[];
      error?: { message: string };
    }>;
    setActive: (params: { sessionToken: string }) => Promise<{
      data?: unknown;
      error?: { message: string };
    }>;
    revoke: (params: { sessionToken: string }) => Promise<{
      data?: unknown;
      error?: { message: string };
    }>;
  };
};

export function useMultiSession() {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const { data: currentSession } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      const response = await multiSession.multiSession.listDeviceSessions({});

      // Debug logging to understand the response structure
      if (process.env.NODE_ENV === 'development') {
        console.log('[MultiSession] Raw response:', response);
        console.log('[MultiSession] Current session:', currentSession);
      }

      if (response.error) {
        console.error('Failed to fetch sessions:', response.error);
        // If API fails but we have a current session, show that at least
        if (currentSession?.user) {
          setSessions([
            {
              token: currentSession.session?.token || '',
              userId: currentSession.user.id,
              userImage: currentSession.user.image,
              userName: currentSession.user.name,
              userEmail: currentSession.user.email,
              isActive: true,
            },
          ]);
        }
        return;
      }

      const data = response.data || [];

      const mappedSessions: DeviceSession[] = data.map(session => {
        // The session token for comparison and switching - prefer nested session.token
        const sessionToken = session.session?.token || session.token;
        const isActive = sessionToken === currentSession?.session?.token;

        if (process.env.NODE_ENV === 'development') {
          console.log('[MultiSession] Session:', {
            outerToken: session.token,
            nestedSessionToken: session.session?.token,
            sessionTokenUsed: sessionToken,
            userId: session.user?.id,
            email: session.user?.email,
            isActive,
          });
        }

        return {
          token: sessionToken,
          userId: session.user?.id || '',
          userImage: session.user?.image,
          userName: session.user?.name,
          userEmail: session.user?.email || '',
          isActive,
        };
      });

      // Known bug workaround: if no sessions marked as active but we have a current session,
      // ensure the current session is in the list and marked as active
      const hasActiveSession = mappedSessions.some(s => s.isActive);
      if (!hasActiveSession && currentSession?.user) {
        const currentSessionInList = mappedSessions.find(
          s => s.userId === currentSession.user.id
        );
        if (currentSessionInList) {
          // Mark the matching session as active
          currentSessionInList.isActive = true;
        } else {
          // Add current session if not in list at all
          mappedSessions.unshift({
            token: currentSession.session?.token || '',
            userId: currentSession.user.id,
            userImage: currentSession.user.image,
            userName: currentSession.user.name,
            userEmail: currentSession.user.email,
            isActive: true,
          });
        }
      }

      // Sort so active session appears first
      mappedSessions.sort(
        (a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0)
      );

      setSessions(mappedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Fallback to showing current session on error
      if (currentSession?.user) {
        setSessions([
          {
            token: currentSession.session?.token || '',
            userId: currentSession.user.id,
            userImage: currentSession.user.image,
            userName: currentSession.user.name,
            userEmail: currentSession.user.email,
            isActive: true,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentSession]);

  useEffect(() => {
    if (currentSession) {
      fetchSessions();
    }
  }, [fetchSessions, currentSession]);

  const switchSession = useCallback(
    async (sessionToken: string) => {
      setIsSwitching(true);
      try {
        const { error } = await multiSession.multiSession.setActive({
          sessionToken,
        });

        if (error) {
          toast({
            title: 'Switch Failed',
            description: 'Failed to switch account',
            variant: 'destructive',
          });
          return { success: false };
        }

        toast({ title: 'Account Switched' });
        router.refresh();
        return { success: true };
      } catch {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return { success: false };
      } finally {
        setIsSwitching(false);
      }
    },
    [toast, router]
  );

  const revokeSession = useCallback(
    async (sessionToken: string) => {
      try {
        const { error } = await multiSession.multiSession.revoke({
          sessionToken,
        });

        if (error) {
          toast({
            title: 'Removal Failed',
            description: 'Failed to remove account',
            variant: 'destructive',
          });
          return { success: false };
        }

        toast({ title: 'Account Removed' });
        await fetchSessions();
        return { success: true };
      } catch {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return { success: false };
      }
    },
    [toast, fetchSessions]
  );

  return {
    sessions,
    isLoading,
    isSwitching,
    switchSession,
    revokeSession,
    refreshSessions: fetchSessions,
  };
}
