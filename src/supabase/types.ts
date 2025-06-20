export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Custom field types
export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "boolean"
  | "currency";

export interface CustomFieldDefinition {
  id: string;
  user_id: string;
  table_name: "job_applications" | "receipts" | "travel";
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  field_options: {
    options?: string[]; // for select type
    currency?: string; // for currency type
    min?: number; // for number/currency type
    max?: number; // for number/currency type
    placeholder?: string; // for text type
  };
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      custom_fields: {
        Row: CustomFieldDefinition;
        Insert: {
          id?: string;
          user_id: string;
          table_name: "job_applications" | "receipts" | "travel";
          field_name: string;
          field_label: string;
          field_type: CustomFieldType;
          field_options?: Json;
          is_required?: boolean;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          table_name?: "job_applications" | "receipts" | "travel";
          field_name?: string;
          field_label?: string;
          field_type?: CustomFieldType;
          field_options?: Json;
          is_required?: boolean;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          message_id: string;
          subject: string;
          from_email: string;
          date: string;
          classification: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message_id: string;
          subject: string;
          from_email: string;
          date: string;
          classification: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message_id?: string;
          subject?: string;
          from_email?: string;
          date?: string;
          classification?: string;
          created_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          email_id: string;
          user_id: string;
          merchant: string;
          amount: number;
          currency: string;
          date: string;
          category: string;
          items: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email_id: string;
          user_id: string;
          merchant: string;
          amount: number;
          currency: string;
          date: string;
          category: string;
          items?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          email_id?: string;
          user_id?: string;
          merchant?: string;
          amount?: number;
          currency?: string;
          date?: string;
          category?: string;
          items?: Json;
          created_at?: string;
        };
      };
      travel: {
        Row: {
          id: string;
          email_id: string;
          user_id: string;
          type: string;
          destination: string;
          start_date: string;
          end_date: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email_id: string;
          user_id: string;
          type: string;
          destination: string;
          start_date: string;
          end_date: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          email_id?: string;
          user_id?: string;
          type?: string;
          destination?: string;
          start_date?: string;
          end_date?: string;
          details?: Json;
          created_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          email_id: string;
          user_id: string;
          company: string;
          position: string;
          status: string;
          applied_date: string;
          country_code?: string;
          country?: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          email_id: string;
          user_id: string;
          company: string;
          position: string;
          status: string;
          applied_date: string;
          country_code?: string;
          country?: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          email_id?: string;
          user_id?: string;
          company?: string;
          position?: string;
          status?: string;
          applied_date?: string;
          country_code?: string;
          country?: string;
          details?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
