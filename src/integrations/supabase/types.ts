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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          client_name: string
          created_at: string
          id: string
          junior_bopm: string
          pod_name: string
          principal_bopm: string
          senior_bopm: string
          vsd_name: string
        }
        Insert: {
          client_name: string
          created_at?: string
          id: string
          junior_bopm?: string
          pod_name?: string
          principal_bopm?: string
          senior_bopm?: string
          vsd_name?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          junior_bopm?: string
          pod_name?: string
          principal_bopm?: string
          senior_bopm?: string
          vsd_name?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          capabilities: string[]
          capability_leader: string
          client_id: string
          contract_duration: string
          contract_end_date: string
          contract_start_date: string
          created_at: string
          currency: string
          deal_name: string
          deal_type: string
          geography: string
          id: string
          is_content_studio: boolean
          mrr: number
          signing_entity: string
          status: string
          total_contract_value: number
          total_creator_cost: number
          vsd_name: string
        }
        Insert: {
          capabilities?: string[]
          capability_leader?: string
          client_id: string
          contract_duration?: string
          contract_end_date?: string
          contract_start_date?: string
          created_at?: string
          currency?: string
          deal_name: string
          deal_type?: string
          geography?: string
          id: string
          is_content_studio?: boolean
          mrr?: number
          signing_entity?: string
          status?: string
          total_contract_value?: number
          total_creator_cost?: number
          vsd_name?: string
        }
        Update: {
          capabilities?: string[]
          capability_leader?: string
          client_id?: string
          contract_duration?: string
          contract_end_date?: string
          contract_start_date?: string
          created_at?: string
          currency?: string
          deal_name?: string
          deal_type?: string
          geography?: string
          id?: string
          is_content_studio?: boolean
          mrr?: number
          signing_entity?: string
          status?: string
          total_contract_value?: number
          total_creator_cost?: number
          vsd_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deployed_creators: {
        Row: {
          bopm_rating: string
          bopm_rating_reason: string
          capability_lead_rating: string
          capability_rating_reason: string
          city: string
          client_billing: number
          created_at: string
          creator_name: string
          currency: string
          deal_id: string
          deal_status: string
          expected_volume: number
          hrbp_name: string
          id: string
          linkedin_id: string
          ops_link: string
          pay_model: string
          pay_rate: number
          role: string
          source: string
          start_date: string
          total_cost: number
        }
        Insert: {
          bopm_rating?: string
          bopm_rating_reason?: string
          capability_lead_rating?: string
          capability_rating_reason?: string
          city?: string
          client_billing?: number
          created_at?: string
          creator_name: string
          currency?: string
          deal_id: string
          deal_status?: string
          expected_volume?: number
          hrbp_name?: string
          id: string
          linkedin_id?: string
          ops_link?: string
          pay_model?: string
          pay_rate?: number
          role?: string
          source?: string
          start_date?: string
          total_cost?: number
        }
        Update: {
          bopm_rating?: string
          bopm_rating_reason?: string
          capability_lead_rating?: string
          capability_rating_reason?: string
          city?: string
          client_billing?: number
          created_at?: string
          creator_name?: string
          currency?: string
          deal_id?: string
          deal_status?: string
          expected_volume?: number
          hrbp_name?: string
          id?: string
          linkedin_id?: string
          ops_link?: string
          pay_model?: string
          pay_rate?: number
          role?: string
          source?: string
          start_date?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "deployed_creators_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      hrbp_connects: {
        Row: {
          created_at: string
          creator_id: string
          date: string
          hrbp_name: string
          id: string
          outcome: string
          summary: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          date: string
          hrbp_name?: string
          id: string
          outcome?: string
          summary?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          date?: string
          hrbp_name?: string
          id?: string
          outcome?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrbp_connects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "deployed_creators"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_payments: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          id: string
          month: string
          paid: boolean
        }
        Insert: {
          amount?: number
          created_at?: string
          creator_id: string
          id: string
          month: string
          paid?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          id?: string
          month?: string
          paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "monthly_payments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "deployed_creators"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          client_name: string
          created_at: string
          deal_id: string
          flow: string
          id: string
          payload: Json
          pod_name: string
          status: string
          updated_at: string
        }
        Insert: {
          client_name?: string
          created_at?: string
          deal_id?: string
          flow: string
          id: string
          payload?: Json
          pod_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          deal_id?: string
          flow?: string
          id?: string
          payload?: Json
          pod_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
