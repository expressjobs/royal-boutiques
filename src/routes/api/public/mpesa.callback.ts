import { createFileRoute } from "@tanstack/react-router";

// M-Pesa STK callback. Safaricom doesn't sign callbacks; we match by CheckoutRequestID
// which is only known to us and Safaricom (sent via an authenticated outbound call).
export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const stk = payload?.Body?.stkCallback;
        if (!stk?.CheckoutRequestID) {
          // Always 200 OK so Safaricom doesn't retry forever on malformed payloads
          return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        const checkoutRequestId: string = stk.CheckoutRequestID;
        const resultCode: number = stk.ResultCode;
        const resultDesc: string = stk.ResultDesc ?? "";
        const items: Array<{ Name: string; Value?: string | number }> = stk.CallbackMetadata?.Item ?? [];
        const get = (k: string) => items.find((i) => i.Name === k)?.Value;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const status = resultCode === 0 ? "succeeded" : resultCode === 1032 ? "cancelled" : "failed";

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .update({
            status,
            result_code: String(resultCode),
            result_desc: resultDesc,
            provider_ref: (get("MpesaReceiptNumber") as string) ?? null,
            raw_response: stk,
          })
          .eq("checkout_request_id", checkoutRequestId)
          .select("order_id")
          .maybeSingle();

        if (payment?.order_id && status === "succeeded") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "processing", payment_method: "mpesa" })
            .eq("id", payment.order_id);
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});
