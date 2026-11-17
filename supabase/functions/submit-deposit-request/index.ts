
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS settings
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Supabase environment configuration is missing");
      return jsonResponse({ success: false, error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "অনুগ্রহ করে প্রথমে Login করুন।" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ success: false, error: "Login session পাওয়া যায়নি। আবার Login করুন।" }, 401);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData.user) {
      console.error("Authentication error:", authError?.message);
      return jsonResponse({ success: false, error: "আপনার Login Session শেষ হয়েছে। আবার Login করুন।" }, 401);
    }

    const userId = userData.user.id;

    let body: Record<string, unknown>;
    try {
      const parsedBody = await req.json();
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        return jsonResponse({ success: false, error: "Invalid request body" }, 400);
      }
      body = parsedBody as Record<string, unknown>;
    } catch {
      return jsonResponse({ success: false, error: "Invalid request body" }, 400);
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 100) {
      return jsonResponse({ success: false, error: "Minimum deposit amount is 100 USDT" }, 400);
    }

    const txHash = String(body.tx_hash ?? "").trim().toLowerCase();
    if (!txHash || txHash.length > 300) {
      return jsonResponse({ success: false, error: "সঠিক Transaction Hash দিন।" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await adminClient
      .from("deposit_requests")
      .insert({ user_id: userId, amount, tx_hash: txHash, status: "PENDING" })
      .select("id")
      .single();

    if (error) {
      console.error("Deposit insert error:", error);
      if (
        error.code === "23505" &&
        (error.constraint === "deposit_requests_tx_hash_key" ||
          error.message?.includes("deposit_requests_tx_hash_key"))
      ) {
        return jsonResponse({
          success: false,
          code: "DUPLICATE_TRANSACTION",
          error: "এই TRX ব্যবহার করা হয়েছে। অনুগ্রহ করে নতুন Transaction Hash দিন।",
        }, 409);
      }
      return jsonResponse({ success: false, error: "Deposit Request জমা করা যায়নি। আবার চেষ্টা করুন।" }, 500);
    }

    console.info("Deposit request submitted:", data.id);
    return jsonResponse({
      success: true,
      message: "Deposit request submitted successfully",
      request_id: data.id,
      status: "PENDING",
      telegram_sent: false,
    }, 200);
  } catch (error) {
    console.error("Submit deposit error:", error);
    return jsonResponse({ success: false, error: "Internal server error" }, 500);
  }
});
