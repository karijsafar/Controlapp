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
      datos_financieros: {
        Row: {
          confirmado: boolean
          created_at: string
          diagnostico_id: string
          id: string
          valores: Json
        }
        Insert: {
          confirmado?: boolean
          created_at?: string
          diagnostico_id: string
          id?: string
          valores?: Json
        }
        Update: {
          confirmado?: boolean
          created_at?: string
          diagnostico_id?: string
          id?: string
          valores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "datos_financieros_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: true
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos: {
        Row: {
          analisis_ia: Json | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_diagnostico"]
          fecha_cierre_periodo: string
          id: string
          meses_periodo: number
          nombre_empresa: string
          puntaje_general: number | null
          respuestas: Json
          rubro: Database["public"]["Enums"]["rubro"]
          semaforo_general:
            | Database["public"]["Enums"]["estado_semaforo"]
            | null
          share_activo: boolean
          share_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analisis_ia?: Json | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_diagnostico"]
          fecha_cierre_periodo: string
          id?: string
          meses_periodo: number
          nombre_empresa: string
          puntaje_general?: number | null
          respuestas?: Json
          rubro: Database["public"]["Enums"]["rubro"]
          semaforo_general?:
            | Database["public"]["Enums"]["estado_semaforo"]
            | null
          share_activo?: boolean
          share_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analisis_ia?: Json | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_diagnostico"]
          fecha_cierre_periodo?: string
          id?: string
          meses_periodo?: number
          nombre_empresa?: string
          puntaje_general?: number | null
          respuestas?: Json
          rubro?: Database["public"]["Enums"]["rubro"]
          semaforo_general?:
            | Database["public"]["Enums"]["estado_semaforo"]
            | null
          share_activo?: boolean
          share_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resultados_ratios: {
        Row: {
          categoria: string
          desvio_pct: number | null
          diagnostico_id: string
          estado: Database["public"]["Enums"]["estado_semaforo"]
          id: string
          nota: string | null
          ratio: string
          referencia: number
          tipo_referencia: string
          valor: number | null
        }
        Insert: {
          categoria: string
          desvio_pct?: number | null
          diagnostico_id: string
          estado: Database["public"]["Enums"]["estado_semaforo"]
          id?: string
          nota?: string | null
          ratio: string
          referencia: number
          tipo_referencia: string
          valor?: number | null
        }
        Update: {
          categoria?: string
          desvio_pct?: number | null
          diagnostico_id?: string
          estado?: Database["public"]["Enums"]["estado_semaforo"]
          id?: string
          nota?: string | null
          ratio?: string
          referencia?: number
          tipo_referencia?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_ratios_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_diagnostico:
        | "borrador"
        | "datos_pendientes_revision"
        | "procesando"
        | "completado"
        | "error"
      estado_semaforo: "verde" | "amarillo" | "rojo" | "no_disponible"
      rubro:
        | "comercio"
        | "industria"
        | "servicios"
        | "gastronomia"
        | "tecnologia"
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
      estado_diagnostico: [
        "borrador",
        "datos_pendientes_revision",
        "procesando",
        "completado",
        "error",
      ],
      estado_semaforo: ["verde", "amarillo", "rojo", "no_disponible"],
      rubro: [
        "comercio",
        "industria",
        "servicios",
        "gastronomia",
        "tecnologia",
      ],
    },
  },
} as const
