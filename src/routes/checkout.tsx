import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, buildWhatsAppUrl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { initiateMpesaStkPush, getPaymentStatus } from "@/lib/mpesa.functions";
import { toast } from "sonner";
import { MessageCircle, CreditCard, Smartphone, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Royal Boutiques" }] }),
  component: CheckoutPage,
});

const SHIPPING = 15;

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<"whatsapp" | "mpesa" | "stripe" | "paypal">("whatsapp");
  const [mpesaStatus, setMpesaStatus] = useState<
    null | "pending" | "succeeded" | "failed" | "cancelled"
  >(null);
  const pollRef = useRef<number | null>(null);
  const initStk = useServerFn(initiateMpesaStkPush);
  const checkStatus = useServerFn(getPaymentStatus);

  const [form, setForm] = useState({
    name: "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  const shipping = subtotal >= 250 ? 0 : SHIPPING;
  const total = Math.max(0, subtotal - discount + shipping);

  if (!user) {
    return (
      <BoutiqueLayout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">Sign in to checkout</h1>
          <Link
            to="/auth"
            className="mt-6 inline-block bg-charcoal text-white px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold"
          >
            Sign In
          </Link>
        </div>
      </BoutiqueLayout>
    );
  }

  if (items.length === 0) {
    return (
      <BoutiqueLayout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h1 className="font-serif text-3xl">Your bag is empty</h1>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-charcoal text-white px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold"
          >
            Shop
          </Link>
        </div>
      </BoutiqueLayout>
    );
  }

  const applyCoupon = async () => {
    if (!coupon) return;
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", coupon.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!data) return toast.error("Invalid coupon");
    if (subtotal < Number(data.min_order))
      return toast.error(`Minimum order ${formatPrice(data.min_order)}`);
    const d =
      data.discount_type === "percent"
        ? subtotal * (Number(data.discount_value) / 100)
        : Number(data.discount_value);
    setDiscount(d);
    toast.success(`Coupon applied — ${formatPrice(d)} off`);
  };

  const placeOrder = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.country) {
      return toast.error("Please complete all fields");
    }
    if (payment === "stripe" || payment === "paypal") {
      return toast.info(
        "This payment method is coming soon. Choose WhatsApp or M-Pesa to complete checkout.",
      );
    }
    setSubmitting(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: payment === "mpesa" ? "pending_payment" : "manual_pending",
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_country: form.country,
        subtotal,
        discount,
        shipping_fee: shipping,
        total,
        coupon_code: discount > 0 ? coupon.toUpperCase() : null,
        payment_method: (payment === "stripe" || payment === "paypal" ? "card" : payment) as
          | "card"
          | "mpesa"
          | "whatsapp"
          | "cod",
      })
      .select("id")
      .single();

    if (error || !order) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Order failed");
    }

    const orderItems = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product.name,
      product_image: it.product.image_url,
      unit_price: Number(it.product.sale_price ?? it.product.price),
      quantity: it.quantity,
      size: it.size,
      color: it.color,
    }));
    const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
    if (oiErr) {
      setSubmitting(false);
      return toast.error(oiErr.message);
    }

    if (payment === "mpesa") {
      const res = await initStk({
        data: { orderId: order.id, phone: form.phone, amountKes: total },
      });
      if (!res.ok) {
        await supabase
          .from("orders")
          .update({ status: "payment_failed" })
          .eq("id", order.id)
          .eq("user_id", user.id);
        setSubmitting(false);
        return toast.error(res.error);
      }
      toast.success(`STK push sent. Approve ${formatPrice(total)} on your phone.`);
      setMpesaStatus("pending");

      // Poll status for ~90s
      const checkoutRequestId = res.checkoutRequestId;
      const started = Date.now();
      pollRef.current = window.setInterval(async () => {
        if (Date.now() - started > 90_000) {
          if (pollRef.current) clearInterval(pollRef.current);
          await supabase
            .from("orders")
            .update({ status: "payment_failed" })
            .eq("id", order.id)
            .eq("user_id", user.id);
          setSubmitting(false);
          setMpesaStatus("failed");
          toast.error("M-Pesa request timed out. Please try again.");
          return;
        }
        const s = await checkStatus({ data: { checkoutRequestId } });
        if (s.status === "succeeded") {
          if (pollRef.current) clearInterval(pollRef.current);
          setMpesaStatus("succeeded");
          await clear.mutateAsync();
          toast.success("Payment received. Thank you.");
          navigate({ to: "/checkout/success", search: { id: order.id } });
        } else if (s.status === "failed" || s.status === "cancelled") {
          if (pollRef.current) clearInterval(pollRef.current);
          await supabase
            .from("orders")
            .update({ status: "payment_failed" })
            .eq("id", order.id)
            .eq("user_id", user.id);
          setSubmitting(false);
          setMpesaStatus(s.status);
          toast.error(s.result_desc ?? "Payment was not completed.");
        }
      }, 3000);
      return;
    }

    // WhatsApp
    const lines = [
      `*New Royal Boutiques Order*`,
      ``,
      `*Customer:* ${form.name}`,
      `*Phone:* ${form.phone}`,
      `*Email:* ${form.email}`,
      ``,
      `*Items:*`,
      ...items.map(
        (i) =>
          `· ${i.product.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` ${i.color}` : ""} × ${i.quantity} — ${formatPrice(Number(i.product.sale_price ?? i.product.price) * i.quantity)}`,
      ),
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      discount > 0 ? `Discount: -${formatPrice(discount)}` : ``,
      `Shipping: ${shipping === 0 ? "Free" : formatPrice(shipping)}`,
      `*Total: ${formatPrice(total)}*`,
      ``,
      `*Delivery Address:*`,
      form.address,
      `${form.city}, ${form.country}`,
      ``,
      `Order ID: ${order.id}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(buildWhatsAppUrl(lines), "_blank");
    await clear.mutateAsync();
    navigate({ to: "/checkout/success", search: { id: order.id } });
  };

  return (
    <BoutiqueLayout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl mb-12">Checkout</h1>
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-10">
            <Section title="Customer Details">
              <Field
                label="Full Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Field
                label="Phone Number"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+254 700 000 000"
              />
            </Section>
            <Section title="Delivery Address">
              <Field
                label="Street Address"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <Field
                  label="Country"
                  value={form.country}
                  onChange={(v) => setForm({ ...form, country: v })}
                />
              </div>
            </Section>
            <Section title="Payment Method">
              <div className="space-y-3">
                <PayOption
                  icon={<Smartphone className="h-4 w-4 text-gold" />}
                  label="M-Pesa"
                  desc="Lipa na M-Pesa · STK push to your phone"
                  active={payment === "mpesa"}
                  onClick={() => setPayment("mpesa")}
                />
                <PayOption
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="WhatsApp Order"
                  desc="Confirm and pay via WhatsApp concierge"
                  active={payment === "whatsapp"}
                  onClick={() => setPayment("whatsapp")}
                />
                <PayOption
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Card (Stripe)"
                  desc="Coming soon — Visa, Mastercard, Amex"
                  active={payment === "stripe"}
                  onClick={() => setPayment("stripe")}
                  disabled
                />
                <PayOption
                  icon={<CreditCard className="h-4 w-4" />}
                  label="PayPal"
                  desc="Coming soon"
                  active={payment === "paypal"}
                  onClick={() => setPayment("paypal")}
                  disabled
                />
              </div>
              {payment === "mpesa" && (
                <div className="mt-4 p-4 rounded-xl bg-gold/5 border border-gold/20 text-xs text-charcoal/70 leading-relaxed">
                  Enter the Safaricom number registered for M-Pesa in the phone field above (e.g.
                  0712 345 678). You'll be charged <strong>{formatPrice(total)}</strong>. An STK
                  push prompt will appear on your phone.
                  {mpesaStatus === "pending" && (
                    <div className="mt-3 flex items-center gap-2 text-gold">
                      <Loader2 className="h-3 w-3 animate-spin" /> Waiting for confirmation…
                    </div>
                  )}
                </div>
              )}
            </Section>
          </div>

          <aside className="bg-nude rounded-2xl p-8 h-fit lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-charcoal/70 truncate pr-2">
                    {i.product.name} × {i.quantity}
                  </span>
                  <span>
                    {formatPrice(Number(i.product.sale_price ?? i.product.price) * i.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-charcoal/10 pt-6">
              <div className="flex gap-2 mb-4">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 bg-white border border-charcoal/10 px-3 py-2 text-sm rounded"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-charcoal text-white px-4 text-[10px] uppercase tracking-widest font-semibold"
                >
                  Apply
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && <Row label="Discount" value={`-${formatPrice(discount)}`} />}
                <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
              </div>
              <div className="flex justify-between text-lg font-serif pt-4 mt-4 border-t border-charcoal/10">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={submitting}
              className="mt-6 w-full bg-charcoal text-white py-4 text-[11px] uppercase tracking-[0.25em] font-semibold disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place Order"}
            </button>
            <p className="text-[10px] text-charcoal/50 mt-3 text-center">
              Secure checkout · Free returns within 30 days
            </p>
          </aside>
        </div>
      </div>
    </BoutiqueLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-2xl mb-6">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-charcoal/60 mb-2 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-white border border-charcoal/15 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold"
      />
    </label>
  );
}
function PayOption({
  icon,
  label,
  desc,
  active,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left flex items-start gap-3 p-4 border-2 rounded-xl transition ${active ? "border-gold bg-gold/5" : "border-charcoal/10 hover:border-charcoal/30"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block font-medium text-sm">{label}</span>
        <span className="block text-xs text-charcoal/60">{desc}</span>
      </span>
    </button>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-charcoal/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}
