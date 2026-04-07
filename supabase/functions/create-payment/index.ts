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

    const { buyer_email, buyer_name, buyer_phone, amount, currency, items } = await req.json();

    if (!buyer_phone || !amount) {
      return new Response(JSON.stringify({ error: "Phone and amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!buyer_name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart items are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure phone starts with 255 (no +)
    let phone = buyer_phone.replace(/\s+/g, "").replace(/^\+/, "");
    if (phone.startsWith("0")) {
      phone = "255" + phone.slice(1);
    }

    if (!phone.startsWith("255")) {
      return new Response(JSON.stringify({ error: "Invalid Tanzanian phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for all DB operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- Find or create customer ---
    const customerEmail = buyer_email || `${phone}@guest.local`;
    let customer;

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select()
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      customer = existingCustomer;
      await supabase.from("customers").update({
        first_name: buyer_name,
        phone: phone,
      }).eq("id", existingCustomer.id);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          first_name: buyer_name,
          phone: phone,
          email: customerEmail,
        })
        .select()
        .single();

      if (customerError) throw customerError;
      customer = newCustomer;
    }

    // --- Create order ---
    const subtotal = Math.round(amount);
    const orderNumber = `ORD-${Date.now()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer.id,
        order_number: orderNumber,
        status: "pending",
        payment_status: "pending",
        subtotal,
        total_amount: subtotal,
        currency: "TZS",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // --- Create order items ---
    const orderItems = items.map((item: { id: string; quantity: number; unit_price: number }) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // --- Trigger USSD push payment via Snippe ---
    const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook`;
    const idempotencyKey = order.id.slice(0, 30);

    const nameParts = (buyer_name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const requestBody: Record<string, unknown> = {
      payment_type: "mobile",
      details: {
        amount: subtotal,
        currency: currency || "TZS",
      },
      phone_number: phone,
      webhook_url: webhookUrl,
    };

    if (firstName || lastName || buyer_email) {
      requestBody.customer = {
        firstname: firstName || "Customer",
        lastname: lastName || "",
        email: buyer_email || `${phone}@guest.local`,
      };
    }

    requestBody.metadata = { order_id: order.id };

    console.log("Snippe request body:", JSON.stringify(requestBody));

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

    const snippeReference = data.data?.reference || null;

    // Store transaction
    const { error: txError } = await supabase.from("transactions").insert({
      order_id: order.id,
      customer_id: customer.id,
      snippe_reference: snippeReference,
      amount: subtotal,
      currency: currency || "TZS",
      buyer_phone: phone,
      buyer_name,
      buyer_email: buyer_email || null,
      status: "pending",
    });

    if (txError) {
      console.error("Transaction insert error:", txError);
    }

    return new Response(JSON.stringify({ success: true, data, order_id: order.id }), {
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
