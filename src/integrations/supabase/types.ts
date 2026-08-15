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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          cnpj: string | null
          contact: string | null
          created_at: string
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          cnpj?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          cnpj?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      drawing_items: {
        Row: {
          codigo_item: string
          created_at: string
          descricao: string | null
          drawing_id: string
          id: string
          is_demo: boolean
          peso_total: number | null
          peso_unitario: number
          quantidade: number
        }
        Insert: {
          codigo_item: string
          created_at?: string
          descricao?: string | null
          drawing_id: string
          id?: string
          is_demo?: boolean
          peso_total?: number | null
          peso_unitario?: number
          quantidade?: number
        }
        Update: {
          codigo_item?: string
          created_at?: string
          descricao?: string | null
          drawing_id?: string
          id?: string
          is_demo?: boolean
          peso_total?: number | null
          peso_unitario?: number
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "drawing_items_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
        ]
      }
      drawings: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          is_demo: boolean
          peso_total: number
          revisao: string | null
          work_order_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          is_demo?: boolean
          peso_total?: number
          revisao?: string | null
          work_order_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          is_demo?: boolean
          peso_total?: number
          revisao?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawings_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_history: {
        Row: {
          acao: string
          created_at: string
          etapa_anterior: Database["public"]["Enums"]["etapa_producao"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_producao"] | null
          id: string
          lot_id: string
          observacao: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_producao"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_producao"] | null
          id?: string
          lot_id: string
          observacao?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_producao"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_producao"] | null
          id?: string
          lot_id?: string
          observacao?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_history_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "production_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_items: {
        Row: {
          concluido_em: string | null
          created_at: string
          drawing_item_id: string
          id: string
          iniciado_em: string | null
          lot_id: string
          obrigatorio: boolean
          observacao: string | null
          quantidade: number
          responsavel_id: string | null
          status: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          drawing_item_id: string
          id?: string
          iniciado_em?: string | null
          lot_id: string
          obrigatorio?: boolean
          observacao?: string | null
          quantidade?: number
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          drawing_item_id?: string
          id?: string
          iniciado_em?: string | null
          lot_id?: string
          obrigatorio?: boolean
          observacao?: string | null
          quantidade?: number
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lot_items_drawing_item_id_fkey"
            columns: ["drawing_item_id"]
            isOneToOne: false
            referencedRelation: "drawing_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lot_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "production_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_stages: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          etapa: Database["public"]["Enums"]["etapa_producao"]
          id: string
          lot_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          etapa: Database["public"]["Enums"]["etapa_producao"]
          id?: string
          lot_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          etapa?: Database["public"]["Enums"]["etapa_producao"]
          id?: string
          lot_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lot_stages_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "production_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      production_lots: {
        Row: {
          concluido_em: string | null
          created_at: string
          created_by: string | null
          drawing_id: string
          etapa_atual: Database["public"]["Enums"]["etapa_producao"]
          etapa_desde: string
          etapa_iniciada_em: string | null
          id: string
          is_demo: boolean
          numero_lote: string
          peso: number
          quantidade: number
          responsavel_id: string | null
          status: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          created_by?: string | null
          drawing_id: string
          etapa_atual?: Database["public"]["Enums"]["etapa_producao"]
          etapa_desde?: string
          etapa_iniciada_em?: string | null
          id?: string
          is_demo?: boolean
          numero_lote: string
          peso?: number
          quantidade?: number
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          created_by?: string | null
          drawing_id?: string
          etapa_atual?: Database["public"]["Enums"]["etapa_producao"]
          etapa_desde?: string
          etapa_iniciada_em?: string | null
          id?: string
          is_demo?: boolean
          numero_lote?: string
          peso?: number
          quantidade?: number
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lots_drawing_id_fkey"
            columns: ["drawing_id"]
            isOneToOne: false
            referencedRelation: "drawings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_demo: boolean
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_demo?: boolean
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_demo?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          data_abertura: string
          id: string
          is_demo: boolean
          numero: string
          pedido: string | null
          peso_concluido: number
          peso_total: number
          prazo: string | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          id?: string
          is_demo?: boolean
          numero: string
          pedido?: string | null
          peso_concluido?: number
          peso_total?: number
          prazo?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          id?: string
          is_demo?: boolean
          numero?: string
          pedido?: string | null
          peso_concluido?: number
          peso_total?: number
          prazo?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_work_etapa: {
        Args: {
          _etapa: Database["public"]["Enums"]["etapa_producao"]
          _user_id: string
        }
        Returns: boolean
      }
      complete_stage: {
        Args: { p_lot_id: string; p_observacao?: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_planner: { Args: { _user_id: string }; Returns: boolean }
      next_etapa: {
        Args: { _e: Database["public"]["Enums"]["etapa_producao"] }
        Returns: Database["public"]["Enums"]["etapa_producao"]
      }
      prev_etapa: {
        Args: { _e: Database["public"]["Enums"]["etapa_producao"] }
        Returns: Database["public"]["Enums"]["etapa_producao"]
      }
      recalc_drawing_weight: {
        Args: { _drawing_id: string }
        Returns: undefined
      }
      recalc_lot_weight: { Args: { _lot_id: string }; Returns: undefined }
      recalc_work_order: { Args: { _wo_id: string }; Returns: undefined }
      return_stage: {
        Args: { p_justificativa: string; p_lot_id: string }
        Returns: undefined
      }
      role_for_etapa: {
        Args: { _etapa: Database["public"]["Enums"]["etapa_producao"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      set_lot_item_status: {
        Args: { p_lot_item_id: string; p_observacao?: string; p_status: string }
        Returns: undefined
      }
      start_stage: {
        Args: { p_lot_id: string; p_observacao?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "administrador"
        | "planejamento"
        | "preparativo"
        | "montagem"
        | "solda"
        | "acabamento"
      etapa_producao:
        | "preparativo"
        | "montagem"
        | "solda"
        | "acabamento"
        | "concluido"
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
      app_role: [
        "administrador",
        "planejamento",
        "preparativo",
        "montagem",
        "solda",
        "acabamento",
      ],
      etapa_producao: [
        "preparativo",
        "montagem",
        "solda",
        "acabamento",
        "concluido",
      ],
    },
  },
} as const
