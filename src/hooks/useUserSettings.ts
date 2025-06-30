import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "./useAuth";

export interface CategorySettings {
  receipt: boolean;
  revenue: boolean;
  travel: boolean;
  job_application: boolean;
}

interface UserSettingsResponse {
  settings: CategorySettings;
}

interface UpdateSettingsRequest {
  categorySettings: CategorySettings;
}

interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  settings: CategorySettings;
}

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query to fetch user settings
  const query = useQuery({
    queryKey: ["userSettings", user?.id],
    queryFn: async (): Promise<CategorySettings> => {
      if (!user?.id) {
        throw new Error("No user authenticated");
      }

      // Get current session for access token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No valid session available");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data: UserSettingsResponse = await response.json();
      return data.settings;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Mutation to update user settings
  const updateMutation = useMutation({
    mutationFn: async (categorySettings: CategorySettings): Promise<UpdateSettingsResponse> => {
      if (!user?.id) {
        throw new Error("No user authenticated");
      }

      // Get current session for access token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("No valid session available");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          categorySettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update settings: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the cache with the new settings
      queryClient.setQueryData(["userSettings", user?.id], data.settings);

      console.log("✅ User settings updated successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to update user settings:", error);
    },
  });

  return {
    // Data
    settings: query.data,

    // States
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Update function
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Refetch function
    refetch: query.refetch,
  };
}

// Default settings for new users
export const defaultCategorySettings: CategorySettings = {
  receipt: true,
  revenue: true,
  travel: true,
  job_application: true,
};
