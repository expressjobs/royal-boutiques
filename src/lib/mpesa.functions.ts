import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Prices are stored and displayed in KES — charged 1:1 via M-Pesa.
const CANONICAL_BASE_URL = "https://royabotiques.com";

const initSchema = z.object({
  orderId: z.string().uuid(),
  phone: z.string().min(9).max(15),
  amountKes: z.number().positive(),
});

function getBaseUrl(env: string) {
  return env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
}

async function getMpesaAccessToken(env: string, consumerKey: string, consumerSecret: string) {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(`${getBaseUrl(env)}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

function normalisePhone(input: string) {
  // Accept +254712345678, 0712345678, 254712345678 → return 2547XXXXXXXX
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export const initiateMpesaStkPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => initSchema.parse(data))
  .handler(async ({ data, context }) => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const env = process.env.MPESA_ENV ?? "sandbox";

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return {
        ok: false as const,
        error: "M-Pesa is not yet configured. Please contact the boutique.",
      };
    }

    // Verify the order belongs to this user
    const { data: order, error: orderErr } = await context.supabase
      .from("orders")
      .select("id, user_id, total")
      .eq("id", data.orderId)
      .single();
    if (orderErr || !order || order.user_id !== context.userId) {
      return { ok: false as const, error: "Order not found." };
    }

    const phone = normalisePhone(data.phone);
    const amountKes = Math.round(data.amountKes);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    let token: string;
    try {
      token = await getMpesaAccessToken(env, consumerKey, consumerSecret);
    } catch (e) {
      return { ok: false as const, error: "Could not reach M-Pesa. Try again shortly." };
    }

    // Callback URL — uses published stable domain
    const callbackBase = process.env.MPESA_CALLBACK_URL?.replace(/\/$/, "");
    if (!callbackBase) {
      if (env === "production") {
        return {
          ok: false as const,
          error: `M-Pesa callback is not configured. Set MPESA_CALLBACK_URL=${CANONICAL_BASE_URL}.`,
        };
      }
      return { ok: false as const, error: "M-Pesa callback URL is not configured." };
    }

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amountKes,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${callbackBase}/api/public/mpesa/callback`,
      AccountReference: `RB-${order.id.slice(0, 8).toUpperCase()}`,
      TransactionDesc: `Royal Boutiques order ${order.id.slice(0, 8)}`,
    };

    const stkRes = await fetch(`${getBaseUrl(env)}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(stkPayload),
    });
    const stkJson = (await stkRes.json()) as any;

    if (!stkRes.ok || stkJson.errorCode) {
      return { ok: false as const, error: stkJson.errorMessage ?? "M-Pesa request rejected." };
    }

    const { CheckoutRequestID, MerchantRequestID } = stkJson;

    // Record the payment attempt (RLS allows the user to insert their own row)
    await context.supabase.from("payments").insert({
      order_id: order.id,
      user_id: context.userId,
      provider: "mpesa",
      checkout_request_id: CheckoutRequestID,
      merchant_request_id: MerchantRequestID,
      phone,
      amount: amountKes,
      currency: "KES",
      status: "processing",
      raw_response: stkJson,
    });

    return { ok: true as const, checkoutRequestId: CheckoutRequestID };
  });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ checkoutRequestId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: payment } = await context.supabase
      .from("payments")
      .select("status, result_desc, order_id")
      .eq("checkout_request_id", data.checkoutRequestId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return payment ?? { status: "pending", result_desc: null, order_id: null };
  });
