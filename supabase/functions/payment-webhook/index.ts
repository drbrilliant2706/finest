import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

async function verifySignature(rawBody: string, headers: Headers, signingKey: string): Promise<boolean> {
  const timestamp = headers.get("x-webhook-timestamp");
  const signature = headers.get("x-webhook-signature");

  if (!timestamp || !signature) {
    console.error("Missing webhook timestamp or signature headers");
    return false;
  }

  // Reject requests older than 5 minutes (replay attack prevention)
  const eventTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - eventTime > 300) {
    console.error("Webhook timestamp too old:", currentTime - eventTime, "seconds");
    return false;
  }

  // Compute expected signature: HMAC-SHA256(signing_key, "{timestamp}.{raw_body}")
  const message = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(signature, expectedSignature)) {
    console.error("Invalid webhook signature");
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Webhook received:", rawBody);

    // Verify webhook signature
    const webhookSecret = Deno.env.get("SNIPPE_WEBHOOK_SECRET");
    if (webhookSecret) {
      const isValid = await verifySignature(rawBody, req.headers, webhookSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("SNIPPE_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const payload = JSON.parse(rawBody);

    // Support both current (2026-01-25) and legacy webhook formats
    const eventType = payload.type || payload.event;
    const eventData = payload.data || payload;
    const reference = eventData.reference || payload.reference;
    const status = eventData.status || payload.status;
    const amountValue = eventData.amount?.value || eventData.amount || 0;
    const currency = eventData.amount?.currency || "TZS";
    const customerPhone = eventData.customer?.phone || "";
    const externalReference = eventData.external_reference || payload.external_reference || null;

    // Calculate net/fees from settlement if available
    const settlement = eventData.settlement || {};
    const fees = settlement.fees?.value || 0;
    const netAmount = settlement.net?.value || (amountValue - fees);

    // Extract order_id from metadata
    const orderId = eventData.metadata?.order_id || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find transaction by snippe_reference
    const { data: transactions, error: findError } = await supabase
      .from("transactions")
      .select("*, orders(subtotal, total_amount)")
      .eq("snippe_reference", reference)
      .limit(1);

    if (findError) {
      console.error("Find transaction error:", findError);
    }

    const transaction = transactions?.[0];
    const dbStatus = status === "completed" ? "completed" : "failed";

    if (transaction) {
      const profit = status === "completed" ? netAmount * 0.3 : 0;

      await supabase
        .from("transactions")
        .update({
          status: dbStatus,
          result: status,
          reference: externalReference,
          profit,
        })
        .eq("snippe_reference", reference);

      // Update order payment status
      if (transaction.order_id) {
        await supabase
          .from("orders")
          .update({
            payment_status: status === "completed" ? "paid" : "failed",
            status: status === "completed" ? "processing" : "pending",
          })
          .eq("id", transaction.order_id);
      }
    } else {
      // No matching transaction found, create one
      await supabase.from("transactions").insert({
        snippe_reference: reference,
        amount: amountValue,
        currency,
        buyer_phone: customerPhone,
        reference: externalReference,
        status: dbStatus,
        result: status,
        profit: status === "completed" ? netAmount * 0.3 : 0,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
