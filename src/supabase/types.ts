export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      emails: {
        Row: {
          id: string
          user_id: string
          message_id: string
          subject: string
          from: string
          date: string
          classification: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id: string
          subject: string
          from: string
          date: string
          classification: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string
          subject?: string
          from?: string
          date?: string
          classification?: string
          created_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          email_id: string
          user_id: string
          merchant: string
          amount: number
          currency: string
          date: string
          category: string
          items: Json
          created_at: string
        }
        Insert: {
          id?: string
          email_id: string
          user_id: string
          merchant: string
          amount: number
          currency: string
          date: string
          category: string
          items?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email_id?: string
          user_id?: string
          merchant?: string
          amount?: number
          currency?: string
          date?: string
          category?: string
          items?: Json
          created_at?: string
        }
      }
      travel: {
        Row: {
          id: string
          email_id: string
          user_id: string
          type: string
          destination: string
          start_date: string
          end_date: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          email_id: string
          user_id: string
          type: string
          destination: string
          start_date: string
          end_date: string
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email_id?: string
          user_id?: string
          type?: string
          destination?: string
          start_date?: string
          end_date?: string
          details?: Json
          created_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          email_id: string
          user_id: string
          company: string
          position: string
          status: string
          applied_date: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          email_id: string
          user_id: string
          company: string
          position: string
          status: string
          applied_date: string
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email_id?: string
          user_id?: string
          company?: string
          position?: string
          status?: string
          applied_date?: string
          details?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}