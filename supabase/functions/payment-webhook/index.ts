import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Webhook received:", rawBody);

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
      // Calculate profit from settlement data (net - cost, or use net as profit indicator)
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
