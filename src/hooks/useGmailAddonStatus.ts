import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "./useAuth";

export interface GmailAddonStatus {
  isActivated: boolean;
  activatedAt: string | null;
  source: string | null;
  hasApiKey: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useGmailAddonStatus(): GmailAddonStatus {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["gmail-addon-status", user?.id],
    queryFn: async () => {
      if (!user?.email) {
        throw new Error("User email not available");
      }

      // Check if user exists in the custom users table (created by Gmail add-on)
      const { data: customUser, error: customUserError } = await supabase
        .from("users")
        .select("id, email, api_key, source, created_at")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      if (customUserError && customUserError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - that's expected for non-activated users
        throw customUserError;
      }

      return {
        customUser,
        isActivated: !!customUser && customUser.source === "gmail_addon",
        activatedAt: customUser?.created_at || null,
        source: customUser?.source || null,
        hasApiKey: !!customUser?.api_key,
      };
    },
    enabled: !!user?.email && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - status doesn't change often
    retry: (failureCount, error: any) => {
      // Don't retry if it's just a "no user found" error
      if (error?.code === "PGRST116") return false;
      return failureCount < 2;
    },
  });

  return {
    isActivated: data?.isActivated || false,
    activatedAt: data?.activatedAt || null,
    source: data?.source || null,
    hasApiKey: data?.hasApiKey || false,
    isLoading: authLoading || isLoading,
    error: error as Error | null,
  };
}
