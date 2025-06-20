import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "../supabase/client";

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
  aud: string;
  created_at: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

/**
 * Custom hook for authentication management using TanStack Query
 * This replaces the old useEffect pattern with proper data fetching
 *
 * Features:
 * - Automatic session management with TanStack Query
 * - Auth state change listener with cache updates
 * - Auto-redirect to login when not authenticated
 * - Session refresh on errors
 * - Proper loading and error states
 */
export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading: authLoading,
    error: authError,
  } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          // Try to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();
          const user = refreshData?.session?.user || null;

          console.log("🔍 Auth status (after refresh):", {
            authenticated: !!user,
            userId: user?.id,
            email: user?.email,
          });

          return user;
        }

        const user = session?.user || null;
        console.log("🔍 Auth status:", {
          authenticated: !!user,
          userId: user?.id,
          email: user?.email,
        });

        return user;
      } catch (error) {
        console.error("Error checking auth:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch too often
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });

  // Set up auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      console.log("🔄 Auth state changed:", {
        authenticated: !!user,
        userId: user?.id,
        email: user?.email,
      });

      // Update the query cache with new auth state
      queryClient.setQueryData(["auth", "session"], user);

      // Redirect to login if user logged out
      if (!user) {
        console.log("🔒 User logged out, redirecting to login...");
        navigate({ to: "/auth" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !authError) {
      console.log("🔒 User not authenticated, redirecting to login...");
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, authError, navigate]);

  return {
    user: user || null,
    isLoading: authLoading,
    error: authError,
    isAuthenticated: !!user,
  };
}
