import { decrypt, PlaidSandbox } from "../bank/provider.ts";
import { admin, body, cors, failure, json, user } from "../_shared/http.ts";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const who = await user(req),
      b = await body(req);
    if (b.action !== "delete") throw new Error("Unknown action");
    const { data: bank } = await admin
      .from("bank_connections")
      .select("encrypted_token")
      .eq("user_id", who.id)
      .maybeSingle();
    if (bank)
      await new PlaidSandbox().call("/item/remove", {
        access_token: await decrypt(bank.encrypted_token),
      });
    const { data: files, error: fe } = await admin.storage
      .from("avatars")
      .list(who.id);
    if (fe) throw fe;
    if (files?.length) {
      const { error } = await admin.storage
        .from("avatars")
        .remove(files.map((f) => `${who.id}/${f.name}`));
      if (error) throw error;
    }
    const { error } = await admin.auth.admin.deleteUser(who.id);
    if (error) throw error;
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
});
