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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          hsn_code: string | null
          id: string
          invoice_id: string
          order_item_id: string | null
          quantity: number
          rate: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          hsn_code?: string | null
          id?: string
          invoice_id: string
          order_item_id?: string | null
          quantity?: number
          rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          order_item_id?: string | null
          quantity?: number
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_orders: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          advance_paid: number | null
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number
          due_amount: number
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_date: string
          invoice_number: string
          notes: string | null
          order_id: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          status: string
          subtotal: number
          taxable_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          advance_paid?: number | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number
          due_amount?: number
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          order_id?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          taxable_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          advance_paid?: number | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          due_amount?: number
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          order_id?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          taxable_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_profiles: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_sets: {
        Row: {
          arm: number | null
          body_posture: string | null
          bottom: number | null
          c_back: number | null
          c_front: number | null
          calf: number | null
          chest: number | null
          created_at: string
          cuff: number | null
          design_notes: string | null
          elbow: number | null
          fit_type: string | null
          fork: number | null
          h_back: number | null
          high_waist: number | null
          hip_lower: number | null
          hip_upper: number | null
          id: string
          inseam: number | null
          knee: number | null
          low_waist: number | null
          measurement_profile_id: string | null
          mid_chest: number | null
          neck: number | null
          order_item_id: string
          reference_images: string[] | null
          shoulder: number | null
          sleeve: number | null
          stomach: number | null
          thigh: number | null
          updated_at: string
        }
        Insert: {
          arm?: number | null
          body_posture?: string | null
          bottom?: number | null
          c_back?: number | null
          c_front?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          cuff?: number | null
          design_notes?: string | null
          elbow?: number | null
          fit_type?: string | null
          fork?: number | null
          h_back?: number | null
          high_waist?: number | null
          hip_lower?: number | null
          hip_upper?: number | null
          id?: string
          inseam?: number | null
          knee?: number | null
          low_waist?: number | null
          measurement_profile_id?: string | null
          mid_chest?: number | null
          neck?: number | null
          order_item_id: string
          reference_images?: string[] | null
          shoulder?: number | null
          sleeve?: number | null
          stomach?: number | null
          thigh?: number | null
          updated_at?: string
        }
        Update: {
          arm?: number | null
          body_posture?: string | null
          bottom?: number | null
          c_back?: number | null
          c_front?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          cuff?: number | null
          design_notes?: string | null
          elbow?: number | null
          fit_type?: string | null
          fork?: number | null
          h_back?: number | null
          high_waist?: number | null
          hip_lower?: number | null
          hip_upper?: number | null
          id?: string
          inseam?: number | null
          knee?: number | null
          low_waist?: number | null
          measurement_profile_id?: string | null
          mid_chest?: number | null
          neck?: number | null
          order_item_id?: string
          reference_images?: string[] | null
          shoulder?: number | null
          sleeve?: number | null
          stomach?: number | null
          thigh?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_sets_measurement_profile_id_fkey"
            columns: ["measurement_profile_id"]
            isOneToOne: false
            referencedRelation: "measurement_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_sets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: string | null
          created_at: string
          design_charges: number
          fabric_name: string | null
          garment_type: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          quantity: number
          quotation_item_id: string | null
          stitching_cost: number
          total_price: number
          unit_price: number
        }
        Insert: {
          addons?: string | null
          created_at?: string
          design_charges?: number
          fabric_name?: string | null
          garment_type: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          quantity?: number
          quotation_item_id?: string | null
          stitching_cost?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          addons?: string | null
          created_at?: string
          design_charges?: number
          fabric_name?: string | null
          garment_type?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          quotation_item_id?: string | null
          stitching_cost?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_amount: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          priority: boolean
          quotation_id: string | null
          status: string
          subtotal: number
          tailor_name: string | null
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          advance_amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          priority?: boolean
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tailor_name?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          advance_amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          priority?: boolean
          quotation_id?: string | null
          status?: string
          subtotal?: number
          tailor_name?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          order_id: string
          payment_date: string
          payment_mode: string
          received_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id: string
          payment_date?: string
          payment_mode?: string
          received_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          order_id?: string
          payment_date?: string
          payment_mode?: string
          received_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_stitching_price: number | null
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_stitching_price?: number | null
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_stitching_price?: number | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          addons: string | null
          created_at: string
          design_charges: number
          fabric_name: string | null
          garment_type: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          quotation_id: string
          stitching_cost: number
          total_price: number
          unit_price: number
        }
        Insert: {
          addons?: string | null
          created_at?: string
          design_charges?: number
          fabric_name?: string | null
          garment_type: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quotation_id: string
          stitching_cost?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          addons?: string | null
          created_at?: string
          design_charges?: number
          fabric_name?: string | null
          garment_type?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          quotation_id?: string
          stitching_cost?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          discount_amount: number
          discount_type: string | null
          discount_value: number | null
          id: string
          notes: string | null
          quotation_number: string
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          notes?: string | null
          quotation_number: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          discount_amount?: number
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          notes?: string | null
          quotation_number?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stitching_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: string
          order_item_id: string
          printed_at: string | null
          started_at: string | null
          status: string
          tailor_name: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          order_item_id: string
          printed_at?: string | null
          started_at?: string | null
          status?: string
          tailor_name?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          order_item_id?: string
          printed_at?: string | null
          started_at?: string | null
          status?: string
          tailor_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stitching_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stitching_jobs_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_quotation_number: { Args: never; Returns: string }
      get_role: { Args: never; Returns: string }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
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
