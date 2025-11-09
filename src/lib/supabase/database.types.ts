export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string;
          content: string;
          username: string;
          user_id: string;
          room: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          username: string;
          user_id: string;
          room?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          username?: string;
          user_id?: string;
          room?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          profile_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          full_name?: string | null;
          profile_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          profile_url?: string | null;
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
