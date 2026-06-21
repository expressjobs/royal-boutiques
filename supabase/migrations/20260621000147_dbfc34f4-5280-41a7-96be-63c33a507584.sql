
-- Enums
DO $$ BEGIN
  CREATE TYPE public.vendor_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vendor_user_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.commission_type AS ENUM ('percentage', 'flat', 'category_percentage', 'category_flat');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_owner_type AS ENUM ('royal_boutiques', 'vendor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add 'vendor' to app_role if not present
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';
EXCEPTION WHEN others THEN NULL; END $$;

-- Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  legal_name text,
  contact_email text NOT NULL,
  contact_phone text,
  description text,
  logo_url text,
  banner_url text,
  status public.vendor_status NOT NULL DEFAULT 'pending',
  country text DEFAULT 'KE',
  city text,
  address text,
  tax_id text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  mpesa_paybill text,
  mpesa_till text,
  default_commission_type public.commission_type NOT NULL DEFAULT 'percentage',
  default_commission_value numeric(12,2) NOT NULL DEFAULT 15.00,
  rating numeric(3,2) DEFAULT 0,
  total_sales numeric(14,2) DEFAULT 0,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at timestamptz,
  suspended_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vendor users
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.vendor_user_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_users TO authenticated;
GRANT ALL ON public.vendor_users TO service_role;
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage vendor_users" ON public.vendor_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendor users see own membership" ON public.vendor_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Vendor products (link table)
CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_sku text,
  vendor_price numeric(12,2),
  vendor_stock integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_products TO authenticated;
GRANT ALL ON public.vendor_products TO service_role;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage vendor_products" ON public.vendor_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendor_products_updated_at BEFORE UPDATE ON public.vendor_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vendor orders (per-vendor split of an order)
CREATE TABLE IF NOT EXISTS public.vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  vendor_earnings numeric(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, vendor_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_orders TO authenticated;
GRANT ALL ON public.vendor_orders TO service_role;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage vendor_orders" ON public.vendor_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendor_orders_updated_at BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vendor payouts
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  status public.payout_status NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  method text,
  reference text,
  notes text,
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payouts TO authenticated;
GRANT ALL ON public.vendor_payouts TO service_role;
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage vendor_payouts" ON public.vendor_payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendor_payouts_updated_at BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Commissions (rule table)
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.commission_type NOT NULL DEFAULT 'percentage',
  value numeric(12,2) NOT NULL DEFAULT 0,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commissions" ON public.commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_commissions_updated_at BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add ownership columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS owner_type public.product_owner_type NOT NULL DEFAULT 'royal_boutiques',
  ADD COLUMN IF NOT EXISTS owner_id uuid;

CREATE INDEX IF NOT EXISTS idx_products_owner ON public.products(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor ON public.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor ON public.vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor ON public.vendor_payouts(vendor_id);
