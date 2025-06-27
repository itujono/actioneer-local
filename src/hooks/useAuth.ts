import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "@tanstack/react-router";
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
  const location = useLocation();

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

          return user;
        }

        const user = session?.user || null;

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

      // Update the query cache with new auth state
      queryClient.setQueryData(["auth", "session"], user);

      // Redirect to login if user logged out
      if (!user) {
        navigate({ to: "/auth" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, navigate]);

  // Redirect to login if not authenticated and on protected route
  useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = ["/", "/auth", "/privacy"];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Only redirect if we're not on a public route and user is not authenticated
    if (!authLoading && !user && !authError && !isPublicRoute) {
      navigate({ to: "/auth" });
    }
  }, [authLoading, user, authError, navigate, location.pathname]);

  return {
    user: user || null,
    isLoading: authLoading,
    error: authError,
    isAuthenticated: !!user,
  };
}
