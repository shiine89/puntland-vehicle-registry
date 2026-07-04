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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_type: string
          reported_date: string
          status: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type: string
          reported_date?: string
          status?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          reported_date?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          alt_phone: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          driving_license_number: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          id: string
          national_id: string | null
          occupation: string | null
          phone: string
          photo_url: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          driving_license_number?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: string | null
          id?: string
          national_id?: string | null
          occupation?: string | null
          phone: string
          photo_url?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          driving_license_number?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          national_id?: string | null
          occupation?: string | null
          phone?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      ownership_history: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          reason: string | null
          transfer_date: string
          transferred_by: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          reason?: string | null
          transfer_date?: string
          transferred_by?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          reason?: string | null
          transfer_date?: string
          transferred_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_history_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
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
      vehicle_documents: {
        Row: {
          active: boolean
          document_type: string
          file_url: string
          id: string
          uploaded_at: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          document_type: string
          file_url: string
          id?: string
          uploaded_at?: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          document_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          active: boolean
          file_url: string
          id: string
          image_type: string
          uploaded_at: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          file_url: string
          id?: string
          image_type: string
          uploaded_at?: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          file_url?: string
          id?: string
          image_type?: string
          uploaded_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          blacklisted: boolean | null
          chassis_number: string
          color: string | null
          created_at: string
          current_owner_id: string | null
          customs_clearance: boolean | null
          drive_type: string | null
          engine_capacity: string | null
          engine_number: string | null
          expiry_date: string | null
          fuel_type: string | null
          horsepower: string | null
          id: string
          import_country: string | null
          inspection_date: string | null
          insurance_provider: string | null
          manufacturer: string | null
          model: string | null
          odometer: number | null
          plate_number: string
          police_clearance: boolean | null
          purchase_date: string | null
          purchase_price: number | null
          recovered: boolean | null
          registration_date: string
          roadworthy: boolean | null
          status: string
          stolen: boolean | null
          tax_paid: boolean | null
          transmission: string | null
          vehicle_type: string
          vin: string | null
          wanted: boolean | null
          year: number | null
        }
        Insert: {
          blacklisted?: boolean | null
          chassis_number: string
          color?: string | null
          created_at?: string
          current_owner_id?: string | null
          customs_clearance?: boolean | null
          drive_type?: string | null
          engine_capacity?: string | null
          engine_number?: string | null
          expiry_date?: string | null
          fuel_type?: string | null
          horsepower?: string | null
          id?: string
          import_country?: string | null
          inspection_date?: string | null
          insurance_provider?: string | null
          manufacturer?: string | null
          model?: string | null
          odometer?: number | null
          plate_number: string
          police_clearance?: boolean | null
          purchase_date?: string | null
          purchase_price?: number | null
          recovered?: boolean | null
          registration_date?: string
          roadworthy?: boolean | null
          status?: string
          stolen?: boolean | null
          tax_paid?: boolean | null
          transmission?: string | null
          vehicle_type: string
          vin?: string | null
          wanted?: boolean | null
          year?: number | null
        }
        Update: {
          blacklisted?: boolean | null
          chassis_number?: string
          color?: string | null
          created_at?: string
          current_owner_id?: string | null
          customs_clearance?: boolean | null
          drive_type?: string | null
          engine_capacity?: string | null
          engine_number?: string | null
          expiry_date?: string | null
          fuel_type?: string | null
          horsepower?: string | null
          id?: string
          import_country?: string | null
          inspection_date?: string | null
          insurance_provider?: string | null
          manufacturer?: string | null
          model?: string | null
          odometer?: number | null
          plate_number?: string
          police_clearance?: boolean | null
          purchase_date?: string | null
          purchase_price?: number | null
          recovered?: boolean | null
          registration_date?: string
          roadworthy?: boolean | null
          status?: string
          stolen?: boolean | null
          tax_paid?: boolean | null
          transmission?: string | null
          vehicle_type?: string
          vin?: string | null
          wanted?: boolean | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_current_owner_id_fkey"
            columns: ["current_owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "officer" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "officer", "viewer"],
    },
  },
} as const
