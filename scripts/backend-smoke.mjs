import { createServer } from "node:http";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
let verified = false,
  limited = false;
const mock = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/auth/v1/user") {
    res.end(
      JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        aud: "authenticated",
        email: "test@example.test",
        factors: verified
          ? [{ id: "factor", status: "verified", factor_type: "totp" }]
          : [],
      }),
    );
  } else if (req.url === "/rest/v1/rpc/consume_limit")
    res.end(JSON.stringify(!limited));
  else if (req.url.startsWith("/rest/v1/opportunities")) res.end("[]");
  else res.end("[]");
});
await new Promise((r) => mock.listen(18082, "127.0.0.1", r));
const jwt = (aal) =>
  [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: "11111111-1111-4111-8111-111111111111",
        aal,
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
      }),
    ).toString("base64url"),
    Buffer.from("test-signature").toString("base64url"),
  ].join(".");
let count = 0;
async function withFunction(name, fn) {
  const child = spawn(
    "./node_modules/.bin/deno",
    [
      "run",
      "--allow-env",
      "--allow-read",
      "--allow-net=0.0.0.0,127.0.0.1",
      `supabase/functions/${name}/index.ts`,
    ],
    {
      env: {
        ...process.env,
        SUPABASE_URL: "http://127.0.0.1:18082",
        SUPABASE_ANON_KEY: "test-anon",
        SUPABASE_SERVICE_ROLE_KEY: "test-service",
        AI_API_KEY: "",
        AI_API_URL: "",
        AI_MODEL: "",
        PLAID_CLIENT_ID: "",
        PLAID_SECRET: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stderr.on("data", (d) => (output += d));
  try {
    let up = false;
    for (let i = 0; i < 60; i++) {
      try {
        await fetch("http://127.0.0.1:8000", { method: "OPTIONS" });
        up = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!up) throw new Error("Function failed to start: " + output);
    await fn();
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => child.once("exit", r));
  }
}
const post = async (body, token, extra = {}) => {
  const r = await fetch("http://127.0.0.1:8000", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return { status: r.status, data };
};
try {
  await withFunction("pocketpal", async () => {
    assert.equal((await post({ messages: [] })).status, 401);
    count++;
    const valid = {
      messages: [{ role: "user", content: "Help me budget." }],
      includeFinancialContext: false,
    };
    assert.match((await post(valid, jwt("aal1"))).data.error, /not configured/);
    count++;
    assert.match(
      (
        await post(
          { messages: [{ role: "system", content: "bad" }] },
          jwt("aal1"),
        )
      ).data.error,
      /Invalid messages/,
    );
    count++;
    verified = true;
    assert.match((await post(valid, jwt("aal1"))).data.error, /Two-factor/);
    count++;
    assert.match((await post(valid, jwt("aal2"))).data.error, /not configured/);
    count++;
    verified = false;
    limited = true;
    assert.equal((await post(valid, jwt("aal1"))).status, 429);
    count++;
    limited = false;
  });
  await withFunction("bank", async () => {
    assert.equal((await post({ action: "status" })).status, 401);
    count++;
    assert.match(
      (await post({ action: "link" }, jwt("aal1"))).data.error,
      /Configure|not configured/,
    );
    count++;
    assert.equal(
      (await post({}, null, { "Plaid-Verification": "tampered" })).status,
      400,
    );
    count++;
  });
  await withFunction("account", async () => {
    assert.equal((await post({ action: "delete" })).status, 401);
    count++;
    assert.match(
      (await post({ action: "unknown" }, jwt("aal1"))).data.error,
      /Unknown action/,
    );
    count++;
  });
  console.log(
    `PASS: ${count} real Edge Function HTTP checks against local mocked Auth/RPC (no live credentials, provider or database).`,
  );
} finally {
  mock.close();
}
