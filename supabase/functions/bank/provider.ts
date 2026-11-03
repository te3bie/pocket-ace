export interface BankProvider {
  call(endpoint: string, payload: Record<string, unknown>): Promise<any>;
}
export class PlaidSandbox implements BankProvider {
  async call(endpoint: string, payload: Record<string, unknown>) {
    const client_id = Deno.env.get("PLAID_CLIENT_ID"),
      secret = Deno.env.get("PLAID_SECRET");
    if (!client_id || !secret)
      throw new Error("Plaid Sandbox is not configured.");
    const response = await fetch(`https://sandbox.plaid.com${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id, secret, ...payload }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        `Bank provider error: ${data.error_code || "unavailable"}`,
      );
    return data;
  }
}
async function key() {
  const raw = Deno.env.get("BANK_TOKEN_KEY");
  if (!raw) throw new Error("Bank token encryption is not configured.");
  return crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
export async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(),
    new TextEncoder().encode(value),
  );
  return `${encode(iv)}.${encode(new Uint8Array(cipher))}`;
}
export async function decrypt(value: string) {
  const [a, b] = value.split(".");
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Uint8Array.from(atob(a), (c) => c.charCodeAt(0)) },
      await key(),
      Uint8Array.from(atob(b), (c) => c.charCodeAt(0)),
    ),
  );
}
