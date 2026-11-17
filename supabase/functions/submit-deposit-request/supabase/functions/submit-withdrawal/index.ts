
import { createClient } from "npm:@supabase/supabase-js@2";

// CORS: Allow requests from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type, x-supabase-api-version, x-client-platform, x-client-platform-version, x-client-runtime, x-client-runtime-version",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  console.log("Withdrawal function started");
  console.log("Request method:", req.method);
  console.log("Request origin:", req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase server configuration");
      return json({ ok: false, error: "Server configuration incomplete" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ ok: false, error: "Login required. Please login again." }, 401);
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return json({ ok: false, error: "Authentication token is missing" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    console.log("Checking user session");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      console.error("Authentication failed:", authError?.message);
      return json({ ok: false, error: "Invalid login session. Please login again." }, 401);
    }

    const userId = authData.user.id;
    console.log("User authenticated:", userId);

    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return json({ ok: false, error: "Invalid request body" }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: "Invalid request body" }, 400);
    }

    const amount = Number(body.amount_usdt);
    const address = String(body.destination_address ?? "").trim();
    const network = String(body.network ?? "TRC20").trim().toUpperCase();

    // Server-side minimum: $100 USDT
    if (!Number.isFinite(amount) || amount < 100) {
      return json({ ok: false, error: "Minimum withdrawal amount is 100 USDT" }, 400);
    }
    if (amount > 1000000000) {
      return json({ ok: false, error: "Withdrawal amount is too large" }, 400);
    }

    if (network !== "TRC20") {
      return json({ ok: false, error: "Only TRC20 network is supported" }, 400);
    }

    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
      return json({ ok: false, error: "Invalid TRC20 wallet address" }, 400);
    }

    console.log("Checking wallet balance");
    const { data: wallet, error: walletError } = await supabase
      .from("wallet_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (walletError) {
      console.error("Wallet balance error:", walletError.message);
      return json({ ok: false, error: "Could not check wallet balance: " + walletError.message }, 500);
    }

    const balance = Number(wallet?.balance ?? 0);
    if (!Number.isFinite(balance) || balance < 0) {
      return json({ ok: false, error: "Invalid wallet balance" }, 500);
    }

    console.log("Available balance:", balance);
    if (amount > balance + 0.00000001) {
      return json({ ok: false, error: "Insufficient USDT balance", available_balance: balance }, 400);
    }

    console.log("Saving withdrawal request");
    const { data: request, error: insertError } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: userId,
        amount_usdt: amount,
        destination_address: address,
        network: "TRC20",
        status: "PENDING",
      })
      .select("id")
      .single();

    if (insertError || !request) {
      console.error("Withdrawal insert failed:", insertError?.message);
      return json({ ok: false, error: insertError?.message ?? "Could not save withdrawal request" }, 500);
    }

    console.log("Withdrawal request saved successfully:", request.id);
    return json({
      ok: true,
      success: true,
      request_id: request.id,
      telegram_sent: false,
      message: "Withdrawal request submitted successfully",
    }, 200);
  } catch (error) {
    console.error("Withdrawal function error:", error);
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500);
  }
});
