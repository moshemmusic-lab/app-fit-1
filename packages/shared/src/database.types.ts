export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_path: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_private: boolean;
          role: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_private?: boolean;
          role?: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_private?: boolean;
          role?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          default_workout_visibility: string;
          experience_level: string | null;
          health_data_consent_at: string | null;
          locale: string;
          notify_reminders: boolean;
          notify_social: boolean;
          onboarding_completed_at: string | null;
          training_goal: string | null;
          units: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          default_workout_visibility?: string;
          experience_level?: string | null;
          health_data_consent_at?: string | null;
          locale?: string;
          notify_reminders?: boolean;
          notify_social?: boolean;
          onboarding_completed_at?: string | null;
          training_goal?: string | null;
          units?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          default_workout_visibility?: string;
          experience_level?: string | null;
          health_data_consent_at?: string | null;
          locale?: string;
          notify_reminders?: boolean;
          notify_social?: boolean;
          onboarding_completed_at?: string | null;
          training_goal?: string | null;
          units?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_onboarding: {
        Args: {
          p_display_name: string;
          p_experience_level: string;
          p_health_data_consent: boolean;
          p_training_goal: string;
          p_units: string;
          p_username: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
