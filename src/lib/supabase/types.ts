export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'user'
  | 'project-manager'
  | 'site-supervisor'
  | 'materials-manager'
  | 'finance-manager'
  | 'executive';

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: never[];
};

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          subscription: SubscriptionPlan | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          subscription?: SubscriptionPlan | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          subscription?: SubscriptionPlan | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string;
          email: string;
          first_name: string | null;
          id: string;
          is_active: boolean;
          last_name: string | null;
          organization_id: string;
          organization_role: OrganizationRole;
          role: 'admin' | 'user';
          updated_at: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name?: string | null;
          id: string;
          is_active?: boolean;
          last_name?: string | null;
          organization_id: string;
          organization_role?: OrganizationRole;
          role?: 'admin' | 'user';
          updated_at?: string;
          username: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_name?: string | null;
          organization_id?: string;
          organization_role?: OrganizationRole;
          role?: 'admin' | 'user';
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      [table: string]: GenericTable;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization_with_owner: {
        Args: {
          p_name: string;
          p_user_email: string;
          p_user_first_name: string;
          p_user_id: string;
          p_user_last_name: string;
        };
        Returns: Database['public']['Tables']['organizations']['Row'];
      };
      [fn: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
