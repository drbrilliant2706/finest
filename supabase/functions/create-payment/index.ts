import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SONICPESA_API_KEY = Deno.env.get("SONICPESA_API_KEY");
    if (!SONICPESA_API_KEY) {
      throw new Error("SonicPesa API key not configured");
    }

    const { buyer_email, buyer_name, buyer_phone, amount, currency, order_id, customer_id } = await req.json();

    if (!buyer_phone || !amount) {
      return new Response(JSON.stringify({ error: "Phone and amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call SonicPesa API to create payment (USSD push)
    const response = await fetch("https://api.sonicpesa.com/api/v1/payment/create_order", {
      method: "POST",
      headers: {
        "X-API-KEY": SONICPESA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyer_email: buyer_email || "",
        buyer_name: buyer_name || "",
        buyer_phone,
        amount,
        currency: currency || "TZS",
        link_url: null,
      }),
    });

    const data = await response.json();
    console.log("SonicPesa response:", JSON.stringify(data));

    if (!response.ok || data.status === "error") {
      console.error("SonicPesa error:", data);
      throw new Error(`SonicPesa API error: ${data.message || JSON.stringify(data)}`);
    }

    // Extract order_id from nested response
    const sonicpesaOrderId = data.data?.order_id || data.order_id || null;

    // Store transaction in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: txError } = await supabase.from("transactions").insert({
      order_id,
      customer_id,
      sonicpesa_order_id: sonicpesaOrderId,
      amount,
      currency: currency || "TZS",
      buyer_phone,
      buyer_name,
      buyer_email,
      status: "pending",
    });

    if (txError) {
      console.error("Transaction insert error:", txError);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
