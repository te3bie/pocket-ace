import { createClient } from "npm:@supabase/supabase-js@2";
export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
export const cors = {
  "Access-Control-Allow-Origin":
    Deno.env.get("APP_ORIGIN") || "http://localhost:8081",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
export async function user(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Unauthorized");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );
  const { data: level, error: le } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (le || (level?.nextLevel === "aal2" && level.currentLevel !== "aal2"))
    throw new Error("Two-factor verification required");
  return data.user;
}
export async function body(req: Request) {
  if (req.method !== "POST") throw new Error("POST required");
  const text = await req.text();
  if (text.length > 30000) throw new Error("Request too large");
  return JSON.parse(text);
}
export async function limit(
  id: string,
  bucket: string,
  max: number,
  seconds: number,
) {
  const { data, error } = await admin.rpc("consume_limit", {
    who: id,
    kind: bucket,
    max_count: max,
    window_seconds: seconds,
  });
  if (error || !data) throw new Error("Usage limit reached. Try again later.");
}
export function failure(e: unknown) {
  const message = e instanceof Error ? e.message : "Request failed";
  return json(
    { error: message },
    message === "Unauthorized" ? 401 : message.includes("limit") ? 429 : 400,
  );
}
