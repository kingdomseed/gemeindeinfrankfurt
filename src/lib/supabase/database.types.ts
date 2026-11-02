// Database types for the Supabase client, in the shape `supabase gen types typescript` emits.
// Regenerate after every migration with `npm run db:types` (needs the local stack from `supabase start`).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      coordinators: {
        Row: {
          user_id: string;
          display_name: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      trainings: {
        Row: {
          id: string;
          slug: string;
          title: Json;
          is_published: boolean;
          fee_cents: number;
          outline_price_cents: number;
          payee_name: string;
          payee_iban: string;
          payment_reference: string;
          venue: string;
          rules: Json;
          outline_order_deadline: string | null;
          report_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: Json;
          is_published?: boolean;
          fee_cents: number;
          outline_price_cents: number;
          payee_name?: string;
          payee_iban?: string;
          payment_reference?: string;
          venue?: string;
          rules?: Json;
          outline_order_deadline?: string | null;
          report_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: Json;
          is_published?: boolean;
          fee_cents?: number;
          outline_price_cents?: number;
          payee_name?: string;
          payee_iban?: string;
          payment_reference?: string;
          venue?: string;
          rules?: Json;
          outline_order_deadline?: string | null;
          report_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          training_id: string;
          message_number: number;
          starts_at: string;
          ends_at: string;
          is_tested: boolean;
        };
        Insert: {
          id?: string;
          training_id: string;
          message_number: number;
          starts_at: string;
          ends_at: string;
          is_tested?: boolean;
        };
        Update: {
          id?: string;
          training_id?: string;
          message_number?: number;
          starts_at?: string;
          ends_at?: string;
          is_tested?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      localities: {
        Row: {
          id: string;
          training_id: string;
          name: string;
          is_home: boolean;
        };
        Insert: {
          id?: string;
          training_id: string;
          name: string;
          is_home?: boolean;
        };
        Update: {
          id?: string;
          training_id?: string;
          name?: string;
          is_home?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "localities_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      registrations: {
        Row: {
          id: string;
          training_id: string;
          locality_id: string | null;
          status: Database["public"]["Enums"]["registration_status"];
          seat_type: Database["public"]["Enums"]["seat_type"];
          first_name: string;
          last_name: string;
          partner_first_name: string | null;
          partner_last_name: string | null;
          email: string;
          phone: string;
          locale: Database["public"]["Enums"]["language_code"];
          group_language: Database["public"]["Enums"]["language_code"];
          outline_language: Database["public"]["Enums"]["language_code"];
          second_outline_language: Database["public"]["Enums"]["language_code"] | null;
          comments: string;
          confirmed_adult: boolean;
          accepted_rules: boolean;
          attended_anaheim: boolean;
          ukraine_not_employed: boolean;
          waiver: Database["public"]["Enums"]["fee_waiver"] | null;
          waiver_reason: string;
          fee_paid: boolean;
          outline_paid: boolean;
          edit_token_hash: string;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          locality_id?: string | null;
          status?: Database["public"]["Enums"]["registration_status"];
          seat_type: Database["public"]["Enums"]["seat_type"];
          first_name: string;
          last_name: string;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          email: string;
          phone?: string;
          locale: Database["public"]["Enums"]["language_code"];
          group_language: Database["public"]["Enums"]["language_code"];
          outline_language: Database["public"]["Enums"]["language_code"];
          second_outline_language?: Database["public"]["Enums"]["language_code"] | null;
          comments?: string;
          confirmed_adult: boolean;
          accepted_rules: boolean;
          attended_anaheim?: boolean;
          ukraine_not_employed?: boolean;
          waiver?: Database["public"]["Enums"]["fee_waiver"] | null;
          waiver_reason?: string;
          fee_paid?: boolean;
          outline_paid?: boolean;
          edit_token_hash: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          training_id?: string;
          locality_id?: string | null;
          status?: Database["public"]["Enums"]["registration_status"];
          seat_type?: Database["public"]["Enums"]["seat_type"];
          first_name?: string;
          last_name?: string;
          partner_first_name?: string | null;
          partner_last_name?: string | null;
          email?: string;
          phone?: string;
          locale?: Database["public"]["Enums"]["language_code"];
          group_language?: Database["public"]["Enums"]["language_code"];
          outline_language?: Database["public"]["Enums"]["language_code"];
          second_outline_language?: Database["public"]["Enums"]["language_code"] | null;
          comments?: string;
          confirmed_adult?: boolean;
          accepted_rules?: boolean;
          attended_anaheim?: boolean;
          ukraine_not_employed?: boolean;
          waiver?: Database["public"]["Enums"]["fee_waiver"] | null;
          waiver_reason?: string;
          fee_paid?: boolean;
          outline_paid?: boolean;
          edit_token_hash?: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_locality_id_fkey";
            columns: ["locality_id"];
            isOneToOne: false;
            referencedRelation: "localities";
            referencedColumns: ["id"];
          },
        ];
      };
      registration_sessions: {
        Row: {
          registration_id: string;
          session_id: string;
        };
        Insert: {
          registration_id: string;
          session_id: string;
        };
        Update: {
          registration_id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_sessions_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_sessions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      outline_orders: {
        Row: {
          training_id: string;
          language: Database["public"]["Enums"]["language_code"];
          quantity: number;
        };
        Insert: {
          training_id: string;
          language: Database["public"]["Enums"]["language_code"];
          quantity: number;
        };
        Update: {
          training_id?: string;
          language?: Database["public"]["Enums"]["language_code"];
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "outline_orders_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      study_groups: {
        Row: {
          id: string;
          training_id: string;
          name: string;
          language: Database["public"]["Enums"]["language_code"];
          locality_id: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          training_id: string;
          name: string;
          language: Database["public"]["Enums"]["language_code"];
          locality_id?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          training_id?: string;
          name?: string;
          language?: Database["public"]["Enums"]["language_code"];
          locality_id?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "study_groups_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_groups_locality_id_fkey";
            columns: ["locality_id"];
            isOneToOne: false;
            referencedRelation: "localities";
            referencedColumns: ["id"];
          },
        ];
      };
      study_group_members: {
        Row: {
          group_id: string;
          registration_id: string;
        };
        Insert: {
          group_id: string;
          registration_id: string;
        };
        Update: {
          group_id?: string;
          registration_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "study_group_members_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          registration_id: string;
          session_id: string;
          mark: Database["public"]["Enums"]["attendance_mark"];
          recorded_by: string | null;
          recorded_at: string;
        };
        Insert: {
          registration_id: string;
          session_id: string;
          mark: Database["public"]["Enums"]["attendance_mark"];
          recorded_by?: string | null;
          recorded_at?: string;
        };
        Update: {
          registration_id?: string;
          session_id?: string;
          mark?: Database["public"]["Enums"]["attendance_mark"];
          recorded_by?: string | null;
          recorded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          training_id: string;
          name: string;
          lead: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          training_id: string;
          name: string;
          lead?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          training_id?: string;
          name?: string;
          lead?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "services_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      message_hymns: {
        Row: {
          id: string;
          session_id: string;
          position: number;
          number_en: string;
          number_de: string | null;
          number_ru: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          position: number;
          number_en: string;
          number_de?: string | null;
          number_ru?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          position?: number;
          number_en?: string;
          number_de?: string | null;
          number_ru?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_hymns_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      message_verses: {
        Row: {
          session_id: string;
          body: Json;
        };
        Insert: {
          session_id: string;
          body?: Json;
        };
        Update: {
          session_id?: string;
          body?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "message_verses_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      test_slots: {
        Row: {
          id: string;
          session_id: string;
          group_id: string;
          note: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          group_id: string;
          note?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          group_id?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: "test_slots_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_slots_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "study_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      reimbursements: {
        Row: {
          id: string;
          training_id: string;
          description: string;
          amount_cents: number;
          receipt_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_id: string;
          description: string;
          amount_cents: number;
          receipt_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          training_id?: string;
          description?: string;
          amount_cents?: number;
          receipt_path?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reimbursements_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      copy_training: {
        Args: { p_shift: unknown; p_slug: string; p_source: string; p_title: Json };
        Returns: string;
      };
      is_coordinator: { Args: never; Returns: boolean };
      purge_personal_data: { Args: { p_training: string }; Returns: undefined };
    };
    Enums: {
      language_code: "de" | "en" | "ru";
      seat_type: "full_time" | "part_time" | "shared";
      registration_status: "active" | "cancelled";
      fee_waiver: "anaheim" | "ukraine_not_employed" | "hardship";
      attendance_mark: "present" | "absent" | "excused" | "not_registered";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
