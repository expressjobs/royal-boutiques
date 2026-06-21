CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text NOT NULL CHECK (provider IN ('mpesa','stripe','paypal','manual')),
  provider_ref text,
  checkout_request_id text,
  merchant_request_id text,
  phone text,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'KES',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','succeeded','failed','cancelled')),
  result_code text,
  result_desc text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_order_idx ON public.payments(order_id);
CREATE INDEX payments_user_idx ON public.payments(user_id);
CREATE INDEX payments_checkout_idx ON public.payments(checkout_request_id);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admins view all payments" ON public.payments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();