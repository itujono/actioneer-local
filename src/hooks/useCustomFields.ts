import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { CustomFieldDefinition } from "../supabase/types";

export interface CustomFieldValue {
  [fieldName: string]: string | number | boolean | null;
}

export interface UseCustomFieldsOptions {
  tableName: "job_applications" | "receipts" | "travel";
  userId?: string;
}

export function useCustomFields({ tableName, userId }: UseCustomFieldsOptions) {
  const queryClient = useQueryClient();

  // Fetch custom field definitions
  const {
    data: customFields,
    isLoading: isLoadingFields,
    error: fieldsError,
  } = useQuery({
    queryKey: ["custom-fields", tableName, userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("user_id", userId)
        .eq("table_name", tableName)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as CustomFieldDefinition[];
    },
    enabled: !!userId,
  });

  // Function to check if a custom field has values in use
  const checkFieldUsage = async (
    fieldName: string
  ): Promise<{ hasValues: boolean; count: number }> => {
    if (!userId) return { hasValues: false, count: 0 };

    try {
      // Query the table to check if any records have values for this custom field
      const { data, error } = await supabase
        .from(tableName)
        .select("details")
        .eq("user_id", userId)
        .not("details->>custom_fields", "is", null);

      if (error) throw error;

      let count = 0;
      if (data) {
        // Check each record to see if it has a value for this field
        count = data.filter((record) => {
          const customFields = record.details?.custom_fields;
          if (!customFields || typeof customFields !== "object") return false;

          const value = customFields[fieldName];
          return value !== null && value !== undefined && value !== "";
        }).length;
      }

      return { hasValues: count > 0, count };
    } catch (error) {
      console.error("Error checking field usage:", error);
      return { hasValues: false, count: 0 };
    }
  };

  // Create custom field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (
      field: Omit<CustomFieldDefinition, "id" | "created_at" | "updated_at">
    ) => {
      const { data, error } = await supabase
        .from("custom_fields")
        .insert(field)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", tableName, userId],
      });
    },
  });

  // Update custom field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CustomFieldDefinition>;
    }) => {
      const { data, error } = await supabase
        .from("custom_fields")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", tableName, userId],
      });
    },
  });

  // Enhanced delete custom field function with usage check and confirmation
  const deleteFieldWithConfirmation = async (
    fieldId: string,
    fieldName: string,
    fieldLabel: string
  ): Promise<boolean> => {
    try {
      // First check if the field has any values in use
      const usage = await checkFieldUsage(fieldName);

      if (usage.hasValues) {
        const message =
          usage.count === 1
            ? `"${fieldLabel}" is currently being used by 1 record. Deleting this field will permanently remove all its data. Are you sure you want to continue?`
            : `"${fieldLabel}" is currently being used by ${usage.count} records. Deleting this field will permanently remove all its data. Are you sure you want to continue?`;

        const confirmed = window.confirm(message);
        if (!confirmed) {
          return false; // User cancelled
        }
      } else {
        // Field has no values, just confirm deletion
        const confirmed = window.confirm(
          `Are you sure you want to delete the "${fieldLabel}" field?`
        );
        if (!confirmed) {
          return false; // User cancelled
        }
      }

      // Proceed with deletion
      const { error } = await supabase
        .from("custom_fields")
        .update({ is_active: false })
        .eq("id", fieldId);

      if (error) throw error;

      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", tableName, userId],
      });

      return true; // Successfully deleted
    } catch (error) {
      console.error("Error deleting field:", error);
      throw error;
    }
  };

  // Original delete field mutation (kept for backwards compatibility)
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await supabase
        .from("custom_fields")
        .update({ is_active: false })
        .eq("id", fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["custom-fields", tableName, userId],
      });
    },
  });

  // Helper function to get custom field value from details JSON
  const getCustomFieldValue = (details: any, fieldName: string): any => {
    if (!details || typeof details !== "object") return null;
    return details.custom_fields?.[fieldName] || null;
  };

  // Helper function to set custom field value in details JSON
  const setCustomFieldValue = (
    details: any,
    fieldName: string,
    value: any
  ): any => {
    const newDetails = { ...details };
    if (!newDetails.custom_fields) {
      newDetails.custom_fields = {};
    }
    newDetails.custom_fields[fieldName] = value;
    return newDetails;
  };

  // Helper function to validate custom field value
  const validateFieldValue = (
    field: CustomFieldDefinition,
    value: any
  ): string | null => {
    if (
      field.is_required &&
      (value === null || value === undefined || value === "")
    ) {
      return `${field.field_label} is required`;
    }

    if (value === null || value === undefined || value === "") {
      return null; // Empty values are okay if not required
    }

    switch (field.field_type) {
      case "number":
      case "currency":
        if (isNaN(Number(value))) {
          return `${field.field_label} must be a valid number`;
        }
        if (
          field.field_options.min !== undefined &&
          Number(value) < field.field_options.min
        ) {
          return `${field.field_label} must be at least ${field.field_options.min}`;
        }
        if (
          field.field_options.max !== undefined &&
          Number(value) > field.field_options.max
        ) {
          return `${field.field_label} must be at most ${field.field_options.max}`;
        }
        break;
      case "select":
        if (
          field.field_options.options &&
          !field.field_options.options.includes(String(value))
        ) {
          return `${
            field.field_label
          } must be one of: ${field.field_options.options.join(", ")}`;
        }
        break;
      case "date":
        if (value && isNaN(Date.parse(value))) {
          return `${field.field_label} must be a valid date`;
        }
        break;
    }

    return null;
  };

  return {
    // Data
    customFields: customFields || [],
    isLoadingFields,
    fieldsError,

    // Mutations
    createField: createFieldMutation.mutate,
    updateField: updateFieldMutation.mutate,
    deleteField: deleteFieldMutation.mutate, // Keep original for backwards compatibility
    deleteFieldWithConfirmation, // New enhanced version
    checkFieldUsage,
    isCreating: createFieldMutation.isPending,
    isUpdating: updateFieldMutation.isPending,
    isDeleting: deleteFieldMutation.isPending,

    // Helpers
    getCustomFieldValue,
    setCustomFieldValue,
    validateFieldValue,
  };
}
