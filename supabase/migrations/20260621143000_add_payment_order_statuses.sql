ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'manual_pending';

CREATE POLICY "users mark own pending payment orders failed"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status::text = 'pending_payment')
WITH CHECK (auth.uid() = user_id AND status::text = 'payment_failed');
