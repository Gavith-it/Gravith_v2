export interface OrganizationRecord {
  id: string;
  name: string;
  is_active: boolean;
  subscription: 'free' | 'basic' | 'premium' | 'enterprise' | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UserProfileRecord {
  id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'user';
  organization_id: string;
  organization_role:
    | 'owner'
    | 'admin'
    | 'manager'
    | 'user'
    | 'project-manager'
    | 'site-supervisor'
    | 'materials-manager'
    | 'finance-manager'
    | 'executive';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRecord;
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          subscription?: 'free' | 'basic' | 'premium' | 'enterprise' | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      user_profiles: {
        Row: UserProfileRecord;
        Insert: {
          id: string;
          username: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'admin' | 'user';
          organization_id: string;
          organization_role?: UserProfileRecord['organization_role'];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
    };
    Views: never;
    Functions: never;
    Enums: never;
    CompositeTypes: never;
  };
}
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
