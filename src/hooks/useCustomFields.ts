import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { CustomFieldDefinition, CustomFieldType } from "../supabase/types";

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

  // Delete custom field mutation
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
    deleteField: deleteFieldMutation.mutate,
    isCreating: createFieldMutation.isPending,
    isUpdating: updateFieldMutation.isPending,
    isDeleting: deleteFieldMutation.isPending,

    // Helpers
    getCustomFieldValue,
    setCustomFieldValue,
    validateFieldValue,
  };
}
