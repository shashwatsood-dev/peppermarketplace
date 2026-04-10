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
      ats_candidate_notes: {
        Row: {
          author: string
          created_at: string
          id: string
          note_text: string
          pipeline_candidate_id: string
        }
        Insert: {
          author?: string
          created_at?: string
          id?: string
          note_text: string
          pipeline_candidate_id: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          note_text?: string
          pipeline_candidate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_candidate_notes_pipeline_candidate_id_fkey"
            columns: ["pipeline_candidate_id"]
            isOneToOne: false
            referencedRelation: "ats_pipeline_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_candidates: {
        Row: {
          alt_phone: string
          availability: string
          city: string
          communication_score: number
          created_at: string
          culture_fit_score: number
          domain_expertise: string
          email: string
          expected_rate: string
          experience: string
          id: string
          language_skills: string
          linkedin: string
          name: string
          notice_period: string
          overall_score: number
          phone: string
          portfolio_url: string
          rate_model: string
          resume_url: string
          role_title: string
          skills: string[]
          source: string
          tags: string[]
          technical_score: number
          tools_proficiency: string
          updated_at: string
        }
        Insert: {
          alt_phone?: string
          availability?: string
          city?: string
          communication_score?: number
          created_at?: string
          culture_fit_score?: number
          domain_expertise?: string
          email?: string
          expected_rate?: string
          experience?: string
          id: string
          language_skills?: string
          linkedin?: string
          name: string
          notice_period?: string
          overall_score?: number
          phone?: string
          portfolio_url?: string
          rate_model?: string
          resume_url?: string
          role_title?: string
          skills?: string[]
          source?: string
          tags?: string[]
          technical_score?: number
          tools_proficiency?: string
          updated_at?: string
        }
        Update: {
          alt_phone?: string
          availability?: string
          city?: string
          communication_score?: number
          created_at?: string
          culture_fit_score?: number
          domain_expertise?: string
          email?: string
          expected_rate?: string
          experience?: string
          id?: string
          language_skills?: string
          linkedin?: string
          name?: string
          notice_period?: string
          overall_score?: number
          phone?: string
          portfolio_url?: string
          rate_model?: string
          resume_url?: string
          role_title?: string
          skills?: string[]
          source?: string
          tags?: string[]
          technical_score?: number
          tools_proficiency?: string
          updated_at?: string
        }
        Relationships: []
      }
      ats_interview_rounds: {
        Row: {
          created_at: string
          feedback: string
          id: string
          interview_type: string
          interviewer: string
          meeting_link: string
          pipeline_candidate_id: string
          rating: number | null
          round_number: number
          scheduled_at: string
          status: string
        }
        Insert: {
          created_at?: string
          feedback?: string
          id?: string
          interview_type?: string
          interviewer?: string
          meeting_link?: string
          pipeline_candidate_id: string
          rating?: number | null
          round_number?: number
          scheduled_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          interview_type?: string
          interviewer?: string
          meeting_link?: string
          pipeline_candidate_id?: string
          rating?: number | null
          round_number?: number
          scheduled_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_interview_rounds_pipeline_candidate_id_fkey"
            columns: ["pipeline_candidate_id"]
            isOneToOne: false
            referencedRelation: "ats_pipeline_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_pipeline_candidates: {
        Row: {
          added_at: string
          assignment_score: number | null
          assignment_submitted: boolean
          availability: string
          candidate_id: string
          capability_notes: string
          capability_rating: string | null
          current_stage: string
          id: string
          offer_amount: string
          offer_status: string | null
          portfolio_links: Json
          rejection_reason: string
          requisition_id: string
          screening_notes: string
          stage_history: Json
          updated_at: string
        }
        Insert: {
          added_at?: string
          assignment_score?: number | null
          assignment_submitted?: boolean
          availability?: string
          candidate_id: string
          capability_notes?: string
          capability_rating?: string | null
          current_stage?: string
          id: string
          offer_amount?: string
          offer_status?: string | null
          portfolio_links?: Json
          rejection_reason?: string
          requisition_id: string
          screening_notes?: string
          stage_history?: Json
          updated_at?: string
        }
        Update: {
          added_at?: string
          assignment_score?: number | null
          assignment_submitted?: boolean
          availability?: string
          candidate_id?: string
          capability_notes?: string
          capability_rating?: string | null
          current_stage?: string
          id?: string
          offer_amount?: string
          offer_status?: string | null
          portfolio_links?: Json
          rejection_reason?: string
          requisition_id?: string
          screening_notes?: string
          stage_history?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_pipeline_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "ats_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_work_samples: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          sample_type: string
          title: string
          url: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          sample_type?: string
          title?: string
          url?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          sample_type?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ats_work_samples_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "ats_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
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
      creator_engagement_notes: {
        Row: {
          author: string
          created_at: string
          creator_id: string
          id: string
          note: string
          note_type: string
        }
        Insert: {
          author?: string
          created_at?: string
          creator_id: string
          id?: string
          note: string
          note_type?: string
        }
        Update: {
          author?: string
          created_at?: string
          creator_id?: string
          id?: string
          note?: string
          note_type?: string
        }
        Relationships: []
      }
      deal_notes: {
        Row: {
          author: string
          created_at: string
          deal_id: string
          id: string
          note: string
        }
        Insert: {
          author?: string
          created_at?: string
          deal_id: string
          id?: string
          note: string
        }
        Update: {
          author?: string
          created_at?: string
          deal_id?: string
          id?: string
          note?: string
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
          health_status: string
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
          health_status?: string
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
          health_status?: string
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
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Enums: {
      app_role: "admin" | "capability_lead_am"
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
      app_role: ["admin", "capability_lead_am"],
    },
  },
} as const
