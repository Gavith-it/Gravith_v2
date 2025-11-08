export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          subscription: 'free' | 'basic' | 'premium' | 'enterprise' | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
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
        Row: {
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
        };
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
