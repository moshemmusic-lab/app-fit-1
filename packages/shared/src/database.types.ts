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
          deleted_at: string | null;
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
          deleted_at?: string | null;
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
          deleted_at?: string | null;
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
      routine_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          notes: string;
          position: number;
          rest_seconds: number | null;
          routine_id: string;
          superset_group: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          exercise_id: string;
          id: string;
          notes?: string;
          position: number;
          rest_seconds?: number | null;
          routine_id: string;
          superset_group?: number | null;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          notes?: string;
          position?: number;
          rest_seconds?: number | null;
          routine_id?: string;
          superset_group?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routine_exercises_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
      };
      routine_folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          position: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id?: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_sets: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          routine_exercise_id: string;
          set_type: Database['public']['Enums']['workout_set_type'];
          target_distance_m: number | null;
          target_duration_s: number | null;
          target_reps: number | null;
          target_weight_kg: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id: string;
          position: number;
          routine_exercise_id: string;
          set_type?: Database['public']['Enums']['workout_set_type'];
          target_distance_m?: number | null;
          target_duration_s?: number | null;
          target_reps?: number | null;
          target_weight_kg?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          routine_exercise_id?: string;
          set_type?: Database['public']['Enums']['workout_set_type'];
          target_distance_m?: number | null;
          target_duration_s?: number | null;
          target_reps?: number | null;
          target_weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_sets_routine_exercise_id_fkey';
            columns: ['routine_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'routine_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      routines: {
        Row: {
          copied_from_routine_id: string | null;
          created_at: string;
          deleted_at: string | null;
          discipline: Database['public']['Enums']['discipline'];
          folder_id: string | null;
          id: string;
          name: string;
          notes: string;
          owner_id: string;
          position: number;
          updated_at: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          copied_from_routine_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          discipline?: Database['public']['Enums']['discipline'];
          folder_id?: string | null;
          id: string;
          name: string;
          notes?: string;
          owner_id: string;
          position?: number;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          copied_from_routine_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          discipline?: Database['public']['Enums']['discipline'];
          folder_id?: string | null;
          id?: string;
          name?: string;
          notes?: string;
          owner_id?: string;
          position?: number;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'routines_copied_from_routine_id_fkey';
            columns: ['copied_from_routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routines_folder_same_owner';
            columns: ['folder_id', 'owner_id'];
            isOneToOne: false;
            referencedRelation: 'routine_folders';
            referencedColumns: ['id', 'owner_id'];
          },
        ];
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
      workout_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          id: string;
          notes: string;
          position: number;
          superset_group: number | null;
          workout_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          exercise_id: string;
          id: string;
          notes?: string;
          position: number;
          superset_group?: number | null;
          workout_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          id?: string;
          notes?: string;
          position?: number;
          superset_group?: number | null;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_sets: {
        Row: {
          calories: number | null;
          completed_at: string;
          created_at: string;
          distance_m: number | null;
          duration_s: number | null;
          id: string;
          position: number;
          reps: number | null;
          rpe: number | null;
          set_type: Database['public']['Enums']['workout_set_type'];
          weight_kg: number | null;
          workout_exercise_id: string;
        };
        ComputedFields: never;
        Insert: {
          calories?: number | null;
          completed_at: string;
          created_at?: string;
          distance_m?: number | null;
          duration_s?: number | null;
          id: string;
          position: number;
          reps?: number | null;
          rpe?: number | null;
          set_type?: Database['public']['Enums']['workout_set_type'];
          weight_kg?: number | null;
          workout_exercise_id: string;
        };
        Update: {
          calories?: number | null;
          completed_at?: string;
          created_at?: string;
          distance_m?: number | null;
          duration_s?: number | null;
          id?: string;
          position?: number;
          reps?: number | null;
          rpe?: number | null;
          set_type?: Database['public']['Enums']['workout_set_type'];
          weight_kg?: number | null;
          workout_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      workouts: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          discipline: Database['public']['Enums']['discipline'];
          ended_at: string;
          external_id: string | null;
          id: string;
          notes: string;
          routine_id: string | null;
          source: Database['public']['Enums']['workout_source'];
          started_at: string;
          title: string;
          updated_at: string;
          user_id: string;
          visibility: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          discipline?: Database['public']['Enums']['discipline'];
          ended_at: string;
          external_id?: string | null;
          id: string;
          notes?: string;
          routine_id?: string | null;
          source?: Database['public']['Enums']['workout_source'];
          started_at: string;
          title: string;
          updated_at?: string;
          user_id: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          discipline?: Database['public']['Enums']['discipline'];
          ended_at?: string;
          external_id?: string | null;
          id?: string;
          notes?: string;
          routine_id?: string | null;
          source?: Database['public']['Enums']['workout_source'];
          started_at?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
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
      save_custom_exercise: { Args: { p_exercise: Json }; Returns: undefined };
      save_routine: { Args: { p_routine: Json }; Returns: undefined };
      save_workout: { Args: { p_workout: Json }; Returns: undefined };
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
      workout_set_type: 'warmup' | 'normal' | 'drop' | 'failure';
      workout_source: 'app' | 'imported';
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
      workout_set_type: ['warmup', 'normal', 'drop', 'failure'],
      workout_source: ['app', 'imported'],
    },
  },
} as const;
