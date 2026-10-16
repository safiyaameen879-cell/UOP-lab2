export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          faculty: string
          id: number
          name: string
        }
        Insert: {
          faculty: string
          id?: number
          name: string
        }
        Update: {
          faculty?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      equipment_issues: {
        Row: {
          actions_taken: string | null
          created_at: string
          description: string
          equipment_ref: string | null
          id: string
          lab_id: number
          priority: Database["public"]["Enums"]["issue_priority"]
          reported_by: string | null
          reported_on: string
          resolution: string | null
          resolved_on: string | null
          status: Database["public"]["Enums"]["issue_status"]
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          description: string
          equipment_ref?: string | null
          id?: string
          lab_id: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          reported_by?: string | null
          reported_on?: string
          resolution?: string | null
          resolved_on?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          description?: string
          equipment_ref?: string | null
          id?: string
          lab_id?: number
          priority?: Database["public"]["Enums"]["issue_priority"]
          reported_by?: string | null
          reported_on?: string
          resolution?: string | null
          resolved_on?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
        }
        Relationships: [
          {
            foreignKeyName: "equipment_issues_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          capacity: number
          code: string
          id: number
          location: string | null
          name: string
          qr_slug: string
          status: Database["public"]["Enums"]["lab_status"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          code: string
          id?: number
          location?: string | null
          name: string
          qr_slug: string
          status?: Database["public"]["Enums"]["lab_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          code?: string
          id?: number
          location?: string | null
          name?: string
          qr_slug?: string
          status?: Database["public"]["Enums"]["lab_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          activity_type: string
          actual_end: string | null
          actual_start: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          department_id: number
          duration_minutes: number | null
          expected_end: string | null
          expected_start: string | null
          id: string
          lab_id: number
          notes: string | null
          participants_actual: number | null
          participants_expected: number | null
          purpose: string
          record_no: string
          responsible_designation: string | null
          responsible_name: string
          status: Database["public"]["Enums"]["record_status"]
          usage_date: string
          verification_note: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          activity_type: string
          actual_end?: string | null
          actual_start?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          department_id: number
          duration_minutes?: number | null
          expected_end?: string | null
          expected_start?: string | null
          id?: string
          lab_id: number
          notes?: string | null
          participants_actual?: number | null
          participants_expected?: number | null
          purpose: string
          record_no: string
          responsible_designation?: string | null
          responsible_name: string
          status?: Database["public"]["Enums"]["record_status"]
          usage_date: string
          verification_note?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          activity_type?: string
          actual_end?: string | null
          actual_start?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          department_id?: number
          duration_minutes?: number | null
          expected_end?: string | null
          expected_start?: string | null
          id?: string
          lab_id?: number
          notes?: string | null
          participants_actual?: number | null
          participants_expected?: number | null
          purpose?: string
          record_no?: string
          responsible_designation?: string | null
          responsible_name?: string
          status?: Database["public"]["Enums"]["record_status"]
          usage_date?: string
          verification_note?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      submit_usage: {
        Args: {
          _activity_type: string
          _contact_email: string
          _contact_phone: string
          _department_id: number
          _expected_end: string
          _expected_start: string
          _notes: string
          _participants_expected: number
          _purpose: string
          _qr_slug: string
          _responsible_designation: string
          _responsible_name: string
          _usage_date: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff"
      issue_priority: "low" | "medium" | "high" | "critical"
      issue_status: "open" | "in_progress" | "resolved"
      lab_status: "active" | "maintenance" | "closed"
      record_status: "pending" | "verified" | "incomplete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      issue_priority: ["low", "medium", "high", "critical"],
      issue_status: ["open", "in_progress", "resolved"],
      lab_status: ["active", "maintenance", "closed"],
      record_status: ["pending", "verified", "incomplete"],
    },
  },
} as const
