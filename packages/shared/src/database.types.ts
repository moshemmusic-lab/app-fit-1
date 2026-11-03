export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      exercise_translations: {
        Row: {
          aliases: string[];
          created_at: string;
          exercise_id: string;
          instructions: string[];
          locale: string;
          name: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          aliases?: string[];
          created_at?: string;
          exercise_id: string;
          instructions?: string[];
          locale: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          aliases?: string[];
          created_at?: string;
          exercise_id?: string;
          instructions?: string[];
          locale?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_translations_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercises: {
        Row: {
          created_at: string;
          disciplines: Database['public']['Enums']['discipline'][];
          equipment: Database['public']['Enums']['equipment_type'];
          id: string;
          owner_id: string | null;
          primary_muscle: Database['public']['Enums']['muscle_group'];
          secondary_muscles: Database['public']['Enums']['muscle_group'][];
          slug: string | null;
          tracking_type: Database['public']['Enums']['exercise_tracking_type'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          disciplines?: Database['public']['Enums']['discipline'][];
          equipment: Database['public']['Enums']['equipment_type'];
          id?: string;
          owner_id?: string | null;
          primary_muscle: Database['public']['Enums']['muscle_group'];
          secondary_muscles?: Database['public']['Enums']['muscle_group'][];
          slug?: string | null;
          tracking_type: Database['public']['Enums']['exercise_tracking_type'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          disciplines?: Database['public']['Enums']['discipline'][];
          equipment?: Database['public']['Enums']['equipment_type'];
          id?: string;
          owner_id?: string | null;
          primary_muscle?: Database['public']['Enums']['muscle_group'];
          secondary_muscles?: Database['public']['Enums']['muscle_group'][];
          slug?: string | null;
          tracking_type?: Database['public']['Enums']['exercise_tracking_type'];
          updated_at?: string;
        };
        Relationships: [];
      };
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      discipline: 'gym';
      equipment_type:
        | 'barbell'
        | 'ez_bar'
        | 'dumbbell'
        | 'kettlebell'
        | 'machine'
        | 'cable'
        | 'smith_machine'
        | 'plate'
        | 'band'
        | 'bodyweight'
        | 'cardio_machine'
        | 'other';
      exercise_tracking_type:
        'weight_reps' | 'bodyweight_reps' | 'duration' | 'distance_duration' | 'calories_duration';
      muscle_group:
        | 'chest'
        | 'shoulders'
        | 'biceps'
        | 'triceps'
        | 'forearms'
        | 'upper_back'
        | 'lats'
        | 'traps'
        | 'lower_back'
        | 'abs'
        | 'obliques'
        | 'glutes'
        | 'quadriceps'
        | 'hamstrings'
        | 'adductors'
        | 'abductors'
        | 'calves'
        | 'full_body'
        | 'cardio';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      discipline: ['gym'],
      equipment_type: [
        'barbell',
        'ez_bar',
        'dumbbell',
        'kettlebell',
        'machine',
        'cable',
        'smith_machine',
        'plate',
        'band',
        'bodyweight',
        'cardio_machine',
        'other',
      ],
      exercise_tracking_type: [
        'weight_reps',
        'bodyweight_reps',
        'duration',
        'distance_duration',
        'calories_duration',
      ],
      muscle_group: [
        'chest',
        'shoulders',
        'biceps',
        'triceps',
        'forearms',
        'upper_back',
        'lats',
        'traps',
        'lower_back',
        'abs',
        'obliques',
        'glutes',
        'quadriceps',
        'hamstrings',
        'adductors',
        'abductors',
        'calves',
        'full_body',
        'cardio',
      ],
    },
  },
} as const;
