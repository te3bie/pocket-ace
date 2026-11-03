import {
  admin,
  body,
  cors,
  failure,
  json,
  limit,
  user,
} from "../_shared/http.ts";
import { decrypt, encrypt, PlaidSandbox } from "./provider.ts";
import { jwtVerify, importJWK, decodeProtectedHeader } from "npm:jose@6";
const provider = new PlaidSandbox();
async function exchangeToken(who: string, publicToken: string) {
  const result = await provider.call("/item/public_token/exchange", {
    public_token: publicToken,
  });
  const { error } = await admin.from("bank_connections").upsert({
    user_id: who,
    encrypted_token: await encrypt(result.access_token),
    item_id: result.item_id,
    account_ids: [],
    cursor: null,
    status: "connected",
  });
  if (error) throw error;
  return result.access_token;
}
async function sync(who: string) {
  const { data: conn, error } = await admin
    .from("bank_connections")
    .select("*")
    .eq("user_id", who)
    .single();
  if (error || !conn) throw new Error("Connect a sandbox bank first.");
  const token = await decrypt(conn.encrypted_token);
  let cursor = conn.cursor,
    more = true,
    count = 0,
    pages = 0;
  while (more && pages++ < 20) {
    const result = await provider.call("/transactions/sync", {
      access_token: token,
      cursor: cursor || undefined,
      count: 100,
    });
    for (const t of [...result.added, ...result.modified]) {
      if (
        !conn.account_ids.includes(t.account_id) ||
        t.iso_currency_code !== "CAD"
      )
        continue;
      if (t.pending_transaction_id) {
        const { error } = await admin
          .from("bank_transactions")
          .update({ removed: true })
          .eq("user_id", who)
          .eq("id", t.pending_transaction_id);
        if (error) throw error;
      }
      const { error } = await admin.from("bank_transactions").upsert({
        id: t.transaction_id,
        user_id: who,
        account_id: t.account_id,
        name: t.name,
        cents: Math.round(t.amount * 100),
        currency: "CAD",
        date: t.date,
        category: t.personal_finance_category?.primary || "Uncategorized",
        removed: false,
      });
      if (error) throw error;
      count++;
    }
    for (const t of result.removed) {
      const { error } = await admin
        .from("bank_transactions")
        .update({ removed: true })
        .eq("user_id", who)
        .eq("id", t.transaction_id);
      if (error) throw error;
    }
    cursor = result.next_cursor;
    more = result.has_more;
  }
  if (more) throw new Error("Sync page limit reached; retry.");
  const { error: saveError } = await admin
    .from("bank_connections")
    .update({
      cursor,
      last_sync: new Date().toISOString(),
      status: "connected",
    })
    .eq("user_id", who);
  if (saveError) throw saveError;
  return count;
}
async function webhook(req: Request) {
  const token = req.headers.get("Plaid-Verification");
  if (!token) throw new Error("Unsigned webhook");
  const raw = await req.text();
  if (raw.length > 100000) throw new Error("Webhook too large");
  const head = decodeProtectedHeader(token);
  if (head.alg !== "ES256" || !head.kid)
    throw new Error("Invalid webhook algorithm");
  const { key } = await provider.call("/webhook_verification_key/get", {
    key_id: head.kid,
  });
  if (key.expired_at) throw new Error("Expired webhook key");
  const result = await jwtVerify(token, await importJWK(key, "ES256"), {
    algorithms: ["ES256"],
    maxTokenAge: "5 min",
  });
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw)),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (result.payload.request_body_sha256 !== hash)
    throw new Error("Webhook body mismatch");
  const event = JSON.parse(raw),
    id = hash;
  const { data: existing } = await admin
    .from("webhook_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (existing?.status === "done") return json({ duplicate: true });
  await admin.from("webhook_events").upsert({
    id,
    status: "processing",
    attempts: (existing?.attempts || 0) + 1,
  });
  if (
    event.webhook_type === "LINK" &&
    event.webhook_code === "SESSION_FINISHED" &&
    event.status === "success"
  ) {
    const { data: session, error } = await admin
      .from("bank_link_sessions")
      .select("*")
      .eq("link_token", event.link_token)
      .maybeSingle();
    if (error) throw error;
    if (
      session &&
      !session.completed &&
      new Date(session.expires_at) > new Date() &&
      event.environment === "sandbox"
    ) {
      if (event.public_tokens?.[0])
        await exchangeToken(session.user_id, event.public_tokens[0]);
      const { error } = await admin
        .from("bank_link_sessions")
        .update({ completed: true })
        .eq("link_token", event.link_token);
      if (error) throw error;
    }
  }
  const { data: conn } = await admin
    .from("bank_connections")
    .select("user_id")
    .eq("item_id", event.item_id)
    .maybeSingle();
  if (conn && event.webhook_type === "TRANSACTIONS") await sync(conn.user_id);
  if (conn && event.webhook_type === "ITEM")
    await admin
      .from("bank_connections")
      .update({ status: event.error ? "reconnect_required" : "connected" })
      .eq("user_id", conn.user_id);
  await admin.from("webhook_events").update({ status: "done" }).eq("id", id);
  return json({ ok: true });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (req.headers.has("Plaid-Verification")) return await webhook(req);
    const who = await user(req),
      b = await body(req);
    await limit(who.id, "bank", 15, 60);
    if (b.action === "status") {
      const { data, error } = await admin
        .from("bank_connections")
        .select("provider,status,last_sync,account_ids")
        .eq("user_id", who.id)
        .maybeSingle();
      if (error) throw error;
      return json(data || { status: "disconnected" });
    }
    if (b.action === "link" || b.action === "reconnect") {
      if (!Deno.env.get("PLAID_WEBHOOK_URL"))
        throw new Error("Configure the signed webhook URL before connecting.");
      let updateToken: string | undefined;
      if (b.action === "reconnect") {
        const { data } = await admin
          .from("bank_connections")
          .select("encrypted_token")
          .eq("user_id", who.id)
          .single();
        if (!data) throw new Error("No bank connected");
        updateToken = await decrypt(data.encrypted_token);
      }
      const result = await provider.call("/link/token/create", {
        user: { client_user_id: who.id },
        client_name: "Pocket Ace Sandbox",
        products: updateToken ? undefined : ["transactions"],
        access_token: updateToken,
        country_codes: ["CA"],
        language: "en",
        webhook: Deno.env.get("PLAID_WEBHOOK_URL"),
        redirect_uri: Deno.env.get("PLAID_REDIRECT_URI"),
        hosted_link: {
          completion_redirect_uri:
            Deno.env.get("PLAID_COMPLETION_URI") ||
            Deno.env.get("PLAID_REDIRECT_URI"),
          is_mobile_app: b.mobile === true,
        },
      });
      const { error } = await admin.from("bank_link_sessions").insert({
        link_token: result.link_token,
        user_id: who.id,
        expires_at: result.expiration,
      });
      if (error) throw error;
      return json({
        url: result.hosted_link_url,
        linkToken: result.link_token,
      });
    }
    if (b.action === "exchange") {
      if (
        typeof b.publicToken !== "string" ||
        !b.publicToken.startsWith("public-sandbox-")
      )
        throw new Error("Expected sandbox public token.");
      const result = await provider.call("/item/public_token/exchange", {
        public_token: b.publicToken,
      });
      const accounts = await provider.call("/accounts/get", {
        access_token: result.access_token,
      });
      const { error } = await admin.from("bank_connections").upsert({
        user_id: who.id,
        encrypted_token: await encrypt(result.access_token),
        item_id: result.item_id,
        account_ids: [],
        cursor: null,
        status: "connected",
      });
      if (error) throw error;
      return json({
        accounts: accounts.accounts
          .filter((a: any) => a.balances.iso_currency_code === "CAD")
          .map((a: any) => ({ id: a.account_id, name: a.name, mask: a.mask })),
      });
    }
    const { data: conn, error } = await admin
      .from("bank_connections")
      .select("*")
      .eq("user_id", who.id)
      .single();
    if (error || !conn) throw new Error("No bank connected.");
    if (b.action === "accounts") {
      const result = await provider.call("/accounts/get", {
        access_token: await decrypt(conn.encrypted_token),
      });
      return json({
        accounts: result.accounts
          .filter((a: any) => a.balances.iso_currency_code === "CAD")
          .map((a: any) => ({
            id: a.account_id,
            name: a.name,
            mask: a.mask,
            balanceCents: Math.round(a.balances.current * 100),
            currency: "CAD",
          })),
        selected: conn.account_ids,
      });
    }
    if (b.action === "select") {
      if (
        !Array.isArray(b.accountIds) ||
        b.accountIds.some((v: unknown) => typeof v !== "string")
      )
        throw new Error("Invalid account selection.");
      const result = await provider.call("/accounts/get", {
        access_token: await decrypt(conn.encrypted_token),
      });
      if (
        b.accountIds.some(
          (id: string) =>
            !result.accounts.some(
              (a: any) =>
                a.account_id === id && a.balances.iso_currency_code === "CAD",
            ),
        )
      )
        throw new Error("Invalid account selection.");
      const { error } = await admin
        .from("bank_connections")
        .update({ account_ids: b.accountIds, cursor: null })
        .eq("user_id", who.id);
      if (error) throw error;
      return json({ selected: true });
    }
    if (b.action === "sync") return json({ count: await sync(who.id) });
    if (b.action === "disconnect") {
      await provider.call("/item/remove", {
        access_token: await decrypt(conn.encrypted_token),
      });
      const { error } = await admin
        .from("bank_connections")
        .delete()
        .eq("user_id", who.id);
      if (error) throw error;
      await admin.from("bank_link_sessions").delete().eq("user_id", who.id);
      return json({ disconnected: true });
    }
    throw new Error("Unknown bank action");
  } catch (e) {
    return failure(e);
  }
});
