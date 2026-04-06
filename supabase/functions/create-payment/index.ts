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
    const SNIPPE_API_KEY = Deno.env.get("SNIPPE_API_KEY");
    if (!SNIPPE_API_KEY) {
      throw new Error("Snippe API key not configured");
    }

    const { buyer_email, buyer_name, buyer_phone, amount, currency, order_id, customer_id } = await req.json();

    if (!buyer_phone || !amount) {
      return new Response(JSON.stringify({ error: "Phone and amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure phone starts with 255 (no +)
    let phone = buyer_phone.replace(/\s+/g, "").replace(/^\+/, "");
    if (phone.startsWith("0")) {
      phone = "255" + phone.slice(1);
    }

    // Build webhook URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;

    // Generate idempotency key (max 30 chars)
    const idempotencyKey = order_id ? order_id.slice(0, 30) : crypto.randomUUID().slice(0, 30);

    // Split buyer_name into first/last
    const nameParts = (buyer_name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build request body
    const requestBody: Record<string, unknown> = {
      payment_type: "mobile",
      details: {
        amount: Math.round(amount),
        currency: currency || "TZS",
      },
      phone_number: phone,
      webhook_url: webhookUrl,
    };

    // Add optional customer info
    if (firstName || lastName || buyer_email) {
      requestBody.customer = {
        firstname: firstName || "Customer",
        lastname: lastName || "",
        email: buyer_email || `${phone}@guest.local`,
      };
    }

    // Add metadata if order_id exists
    if (order_id) {
      requestBody.metadata = { order_id };
    }

    console.log("Snippe request body:", JSON.stringify(requestBody));

    // Call Snippe API to create mobile money payment
    const response = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SNIPPE_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("Snippe response:", JSON.stringify(data));

    if (!response.ok || data.status === "error") {
      console.error("Snippe error:", data);
      throw new Error(`Snippe API error: ${data.message || JSON.stringify(data)}`);
    }

    // Extract reference from response
    const snippeReference = data.data?.reference || null;

    // Store transaction in database
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: txError } = await supabase.from("transactions").insert({
      order_id,
      customer_id,
      snippe_reference: snippeReference,
      amount: Math.round(amount),
      currency: currency || "TZS",
      buyer_phone: phone,
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
