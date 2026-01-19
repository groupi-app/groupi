"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

// ===== API REFERENCES =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userMutations: any;

function initApi() {
  if (!userQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    userQueries = api.users?.queries ?? {};
    userMutations = api.users?.mutations ?? {};
  }
}
initApi();

// ===== USER QUERIES =====

/**
 * Get current user profile
 */
export function useCurrentUserProfile() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(userQueries.getCurrentUserProfile as any, {});
}

/**
 * Get user profile by username
 */
export function useUserByUsername(username: string) {
  return useQuery(userQueries.getUserByUsername, { username });
}

/**
 * Get user profile by user ID
 */
export function useUserProfile(userId: string) {
  return useQuery(userQueries.getUserProfileByUserId, { userId });
}

// ===== USER MUTATIONS =====

/**
 * Update current user's profile
 */
export function useUpdateUserProfile() {
  const updateProfile = useMutation(userMutations.updateUserProfile);
  const { toast } = useToast();

  return useCallback(async (data: {
    name?: string;
    username?: string;
    pronouns?: string;
    bio?: string;
    image?: string;
    imageStorageId?: Id<"_storage">;
    clearImage?: boolean;
  }) => {
    try {
      const result = await updateProfile(data);

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [updateProfile, toast]);
}

/**
 * Update user's notification settings
 */
export function useUpdateUserNotificationSettings() {
  const updateSettings = useMutation(userMutations.updateUserNotificationSettings);
  const { toast } = useToast();

  return useCallback(async (data: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) => {
    try {
      const result = await updateSettings(data);

      toast({
        title: "Success",
        description: "Notification settings updated successfully!",
      });

      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
      throw error;
    }
  }, [updateSettings, toast]);
}

/**
 * Delete user account (requires confirmation)
 */
export function useDeleteUserAccount() {
  const deleteAccount = useMutation(userMutations.deleteUserAccount);
  const { toast } = useToast();

  return useCallback(async (confirmation: string) => {
    try {
      const result = await deleteAccount({ confirmation });

      toast({
        title: "Account Deletion Initiated",
        description: "Your account deletion request has been processed.",
        variant: "destructive",
      });

      return result;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [deleteAccount, toast]);
}

// ===== COMBINED HOOKS =====

/**
 * Complete user management hook
 */
export function useUserManagement() {
  const profile = useCurrentUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updateSettings = useUpdateUserNotificationSettings();

  return {
    // Data
    user: profile?.user,
    person: profile?.person,

    // Loading state
    isLoading: profile === undefined,

    // Actions
    updateProfile,
    updateSettings,
  };
}

// ===== HOOK ALIASES FOR COMPONENT COMPATIBILITY =====

/**
 * Alias for useCurrentUserProfile - for component compatibility
 */
export const useCurrentUser = useCurrentUserProfile;

/**
 * Authentication state hook - checks if user is authenticated
 *
 * Uses useConvexAuth() to properly wait for Convex to validate the auth token.
 * Better Auth will reflect an authenticated user before Convex does, as the
 * Convex client must validate the token. This prevents false redirects to
 * sign-in when refreshing the page while authenticated.
 */
export function useAuthState() {
  const { isLoading: isConvexAuthLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const user = useCurrentUserProfile();

  // Consider loading if either:
  // 1. Convex auth is still loading (validating token)
  // 2. Convex auth says authenticated but user profile query is still in-flight
  const isLoading = isConvexAuthLoading || (isConvexAuthenticated && user === undefined);

  return {
    isAuthenticated: isConvexAuthenticated && !!user?.user,
    isLoading,
    user: user?.user || null,
    person: user?.person || null,
  };
}