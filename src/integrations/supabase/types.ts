export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string;
          color: string | null;
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          size: string | null;
        };
        Insert: {
          cart_id: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          size?: string | null;
        };
        Update: {
          cart_id?: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          size?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      commissions: {
        Row: {
          category_id: string | null;
          created_at: string;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          priority: number;
          starts_at: string | null;
          type: Database["public"]["Enums"]["commission_type"];
          updated_at: string;
          value: number;
          vendor_id: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          priority?: number;
          starts_at?: string | null;
          type?: Database["public"]["Enums"]["commission_type"];
          updated_at?: string;
          value?: number;
          vendor_id?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          priority?: number;
          starts_at?: string | null;
          type?: Database["public"]["Enums"]["commission_type"];
          updated_at?: string;
          value?: number;
          vendor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commissions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commissions_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string;
          discount_type: string;
          discount_value: number;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          min_order: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          discount_type: string;
          discount_value: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          min_order?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          discount_type?: string;
          discount_value?: number;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          min_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          order_id: string;
          product_id: string | null;
          product_image: string | null;
          product_name: string;
          quantity: number;
          size: string | null;
          unit_price: number;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_image?: string | null;
          product_name: string;
          quantity: number;
          size?: string | null;
          unit_price: number;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_image?: string | null;
          product_name?: string;
          quantity?: number;
          size?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          coupon_code: string | null;
          created_at: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          discount: number;
          id: string;
          notes: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          shipping_address: string;
          shipping_city: string;
          shipping_country: string;
          shipping_fee: number;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          coupon_code?: string | null;
          created_at?: string;
          customer_email: string;
          customer_name: string;
          customer_phone: string;
          discount?: number;
          id?: string;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          shipping_address: string;
          shipping_city: string;
          shipping_country: string;
          shipping_fee?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          coupon_code?: string | null;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          customer_phone?: string;
          discount?: number;
          id?: string;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          shipping_address?: string;
          shipping_city?: string;
          shipping_country?: string;
          shipping_fee?: number;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          checkout_request_id: string | null;
          created_at: string;
          currency: string;
          id: string;
          merchant_request_id: string | null;
          order_id: string | null;
          phone: string | null;
          provider: string;
          provider_ref: string | null;
          raw_response: Json | null;
          result_code: string | null;
          result_desc: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          checkout_request_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          merchant_request_id?: string | null;
          order_id?: string | null;
          phone?: string | null;
          provider: string;
          provider_ref?: string | null;
          raw_response?: Json | null;
          result_code?: string | null;
          result_desc?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          checkout_request_id?: string | null;
          created_at?: string;
          currency?: string;
          id?: string;
          merchant_request_id?: string | null;
          order_id?: string | null;
          phone?: string | null;
          provider?: string;
          provider_ref?: string | null;
          raw_response?: Json | null;
          result_code?: string | null;
          result_desc?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          colors: string[];
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          is_bestseller: boolean;
          is_luxury: boolean;
          is_new: boolean;
          name: string;
          owner_id: string | null;
          owner_type: Database["public"]["Enums"]["product_owner_type"];
          price: number;
          rating: number;
          review_count: number;
          sale_price: number | null;
          sizes: string[];
          slug: string;
          stock: number;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          colors?: string[];
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_bestseller?: boolean;
          is_luxury?: boolean;
          is_new?: boolean;
          name: string;
          owner_id?: string | null;
          owner_type?: Database["public"]["Enums"]["product_owner_type"];
          price: number;
          rating?: number;
          review_count?: number;
          sale_price?: number | null;
          sizes?: string[];
          slug: string;
          stock?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          colors?: string[];
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          is_bestseller?: boolean;
          is_luxury?: boolean;
          is_new?: boolean;
          name?: string;
          owner_id?: string | null;
          owner_type?: Database["public"]["Enums"]["product_owner_type"];
          price?: number;
          rating?: number;
          review_count?: number;
          sale_price?: number | null;
          sizes?: string[];
          slug?: string;
          stock?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          is_approved: boolean;
          product_id: string;
          rating: number;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          product_id: string;
          rating: number;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          is_approved?: boolean;
          product_id?: string;
          rating?: number;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vendor_orders: {
        Row: {
          commission_amount: number;
          created_at: string;
          id: string;
          order_id: string;
          payout_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          updated_at: string;
          vendor_earnings: number;
          vendor_id: string;
        };
        Insert: {
          commission_amount?: number;
          created_at?: string;
          id?: string;
          order_id: string;
          payout_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          updated_at?: string;
          vendor_earnings?: number;
          vendor_id: string;
        };
        Update: {
          commission_amount?: number;
          created_at?: string;
          id?: string;
          order_id?: string;
          payout_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          updated_at?: string;
          vendor_earnings?: number;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_orders_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_payouts: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          method: string | null;
          notes: string | null;
          period_end: string | null;
          period_start: string | null;
          processed_at: string | null;
          processed_by: string | null;
          reference: string | null;
          status: Database["public"]["Enums"]["payout_status"];
          updated_at: string;
          vendor_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
          vendor_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          period_end?: string | null;
          period_start?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payout_status"];
          updated_at?: string;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_products: {
        Row: {
          approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          product_id: string;
          updated_at: string;
          vendor_id: string;
          vendor_price: number | null;
          vendor_sku: string | null;
          vendor_stock: number | null;
        };
        Insert: {
          approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          product_id: string;
          updated_at?: string;
          vendor_id: string;
          vendor_price?: number | null;
          vendor_sku?: string | null;
          vendor_stock?: number | null;
        };
        Update: {
          approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          product_id?: string;
          updated_at?: string;
          vendor_id?: string;
          vendor_price?: number | null;
          vendor_sku?: string | null;
          vendor_stock?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_users: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["vendor_user_role"];
          user_id: string;
          vendor_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["vendor_user_role"];
          user_id: string;
          vendor_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["vendor_user_role"];
          user_id?: string;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_users_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendors: {
        Row: {
          address: string | null;
          approved_at: string | null;
          approved_by: string | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_name: string | null;
          banner_url: string | null;
          business_name: string;
          city: string | null;
          contact_email: string;
          contact_phone: string | null;
          country: string | null;
          created_at: string;
          default_commission_type: Database["public"]["Enums"]["commission_type"];
          default_commission_value: number;
          description: string | null;
          id: string;
          legal_name: string | null;
          logo_url: string | null;
          metadata: Json | null;
          mpesa_paybill: string | null;
          mpesa_till: string | null;
          rating: number | null;
          slug: string;
          status: Database["public"]["Enums"]["vendor_status"];
          suspended_at: string | null;
          suspended_reason: string | null;
          tax_id: string | null;
          total_sales: number | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          banner_url?: string | null;
          business_name: string;
          city?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          default_commission_type?: Database["public"]["Enums"]["commission_type"];
          default_commission_value?: number;
          description?: string | null;
          id?: string;
          legal_name?: string | null;
          logo_url?: string | null;
          metadata?: Json | null;
          mpesa_paybill?: string | null;
          mpesa_till?: string | null;
          rating?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["vendor_status"];
          suspended_at?: string | null;
          suspended_reason?: string | null;
          tax_id?: string | null;
          total_sales?: number | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_name?: string | null;
          banner_url?: string | null;
          business_name?: string;
          city?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string;
          default_commission_type?: Database["public"]["Enums"]["commission_type"];
          default_commission_value?: number;
          description?: string | null;
          id?: string;
          legal_name?: string | null;
          logo_url?: string | null;
          metadata?: Json | null;
          mpesa_paybill?: string | null;
          mpesa_till?: string | null;
          rating?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["vendor_status"];
          suspended_at?: string | null;
          suspended_reason?: string | null;
          tax_id?: string | null;
          total_sales?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer" | "vendor";
      commission_type: "percentage" | "flat" | "category_percentage" | "category_flat";
      order_status:
        | "pending"
        | "pending_payment"
        | "payment_failed"
        | "paid"
        | "manual_pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_method: "whatsapp" | "mpesa" | "card" | "cod";
      payout_status: "pending" | "processing" | "paid" | "failed" | "cancelled";
      product_owner_type: "royal_boutiques" | "vendor";
      vendor_status: "pending" | "approved" | "suspended" | "rejected";
      vendor_user_role: "owner" | "manager" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "vendor"],
      commission_type: ["percentage", "flat", "category_percentage", "category_flat"],
      order_status: ["pending", "processing", "shipped", "delivered", "cancelled"],
      payment_method: ["whatsapp", "mpesa", "card", "cod"],
      payout_status: ["pending", "processing", "paid", "failed", "cancelled"],
      product_owner_type: ["royal_boutiques", "vendor"],
      vendor_status: ["pending", "approved", "suspended", "rejected"],
      vendor_user_role: ["owner", "manager", "staff"],
    },
  },
} as const;
