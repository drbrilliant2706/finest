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
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload));

    const { order_id, result, amount, currency, buyer_phone, reference, timestamp } = payload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update transaction status
    const { data: transactions, error: findError } = await supabase
      .from("transactions")
      .select("*, orders(subtotal, total_amount)")
      .eq("sonicpesa_order_id", order_id)
      .limit(1);

    if (findError) {
      console.error("Find transaction error:", findError);
    }

    const transaction = transactions?.[0];
    const status = result === "SUCCESS" ? "completed" : "failed";

    if (transaction) {
      // Calculate profit (total_amount - cost, simplified as 30% margin)
      const profit = result === "SUCCESS" ? amount * 0.3 : 0;

      await supabase
        .from("transactions")
        .update({
          status,
          result,
          reference,
          profit,
        })
        .eq("sonicpesa_order_id", order_id);

      // Update order payment status
      if (transaction.order_id) {
        await supabase
          .from("orders")
          .update({
            payment_status: result === "SUCCESS" ? "paid" : "failed",
            status: result === "SUCCESS" ? "processing" : "pending",
          })
          .eq("id", transaction.order_id);
      }
    } else {
      // No matching transaction found, create one
      await supabase.from("transactions").insert({
        sonicpesa_order_id: order_id,
        amount,
        currency: currency || "TZS",
        buyer_phone,
        reference,
        status,
        result,
        profit: result === "SUCCESS" ? amount * 0.3 : 0,
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
