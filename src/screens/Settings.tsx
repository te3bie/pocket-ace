import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { View, Text, Platform, Linking, Image } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import { Button, Chips, Field, Link, Sheet, colors, s } from "../components/ui";
import { initial, useStore } from "../lib/store";
import { invoke, supabase } from "../lib/supabase";
import { requestNotifications } from "../lib/notifications";
import { parseCSV, ImportedTransaction } from "../domain/csv";
import { money } from "../domain/finance";
import { router } from "expo-router";
export default function Settings() {
  const { data, update, demo, exit, session } = useStore();
  const [error, setError] = useState("");
  const [timezone, setTimezone] = useState(data.settings.timezone);
  const [message, setMessage] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ImportedTransaction[] | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [mfa, setMfa] = useState<{
    id: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [factors, setFactors] = useState<
    { id: string; friendly_name?: string }[]
  >([]);
  const [bank, setBank] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [pendingFactor, setPendingFactor] = useState("");
  const [busy, setBusy] = useState(false);
  const task = async (fn: () => Promise<void>) => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const loadFactors = async () => {
    if (demo) return;
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    setFactors(data.totp);
  };
  useEffect(() => {
    loadFactors().catch((e) => setError(e.message));
  }, []);
  const exportData = async () => {
    let bankExport: unknown = null;
    if (!demo) {
      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("*");
      if (error) throw error;
      bankExport = {
        transactions,
        connection: await invoke("bank", { action: "status" }),
      };
    }
    const json = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        currency: "CAD",
        data,
        bank: bankExport,
      },
      null,
      2,
    );
    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pocket-ace-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fs = await import("expo-file-system");
      const sharing = await import("expo-sharing");
      const file = new fs.File(fs.Paths.cache, "pocket-ace-export.json");
      file.write(json);
      await sharing.shareAsync(file.uri, { mimeType: "application/json" });
    }
    setMessage("Export prepared. Keep this file private.");
  };
  return (
    <View style={s.page}>
      <Text style={s.title}>Settings & privacy</Text>
      {error && (
        <Text accessibilityLiveRegion="polite" style={s.error}>
          {error}
        </Text>
      )}
      {message && (
        <Text accessibilityLiveRegion="polite" style={s.badge}>
          {message}
        </Text>
      )}
      {busy && <Text style={s.muted}>Working…</Text>}
      <View style={s.card}>
        <Text style={s.h2}>Reminders, on your terms</Text>
        <Text style={s.muted}>
          Local reminders are scheduled on this device for the next 60 days, up
          to 55 items. Open the app regularly to refresh them.
        </Text>
        <Button
          secondary
          title={
            data.settings.notifications
              ? "Turn reminders off"
              : "Enable device reminders"
          }
          onPress={() =>
            task(async () => {
              if (!data.settings.notifications) await requestNotifications();
              update((d) => ({
                ...d,
                settings: {
                  ...d.settings,
                  notifications: !d.settings.notifications,
                },
              }));
            })
          }
        />
        <Chips
          values={[
            "Same day",
            "1 day before",
            "3 days before",
            "7 days before",
          ]}
          value={
            [
              "Same day",
              "1 day before",
              "",
              "3 days before",
              "",
              "",
              "",
              "7 days before",
            ][data.settings.reminderDays] || "1 day before"
          }
          onChange={(v) =>
            update((d) => ({
              ...d,
              settings: {
                ...d.settings,
                reminderDays: v === "Same day" ? 0 : parseInt(v),
              },
            }))
          }
        />
        <Text style={s.muted}>
          Reminders fire at 9 a.m. in your planning timezone. Device timezone: (
          {Intl.DateTimeFormat().resolvedOptions().timeZone}). The planning
          timezone below controls reminders, including daylight-saving changes.
        </Text>
        <Field
          label="Planning timezone (IANA)"
          value={timezone}
          onChangeText={setTimezone}
        />
        <Button
          secondary
          title="Save timezone"
          onPress={() =>
            task(async () => {
              new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(
                new Date(),
              );
              update((d) => ({ ...d, settings: { ...d.settings, timezone } }));
              setMessage("Planning timezone updated.");
            })
          }
        />
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Account security</Text>
        <Text style={s.muted}>
          {demo
            ? "Security controls require a live account."
            : session?.user.email}
        </Text>
        {!demo && (
          <>
            <Button
              secondary
              title="Send password reset email"
              onPress={() =>
                task(async () => {
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    session!.user.email!,
                    { redirectTo: LinkingURL() },
                  );
                  if (error) throw error;
                  setMessage("Check your email for a recovery link.");
                })
              }
            />
            <Button
              secondary
              title="Enroll authenticator (TOTP)"
              onPress={() =>
                task(async () => {
                  const { data, error } = await supabase.auth.mfa.enroll({
                    factorType: "totp",
                    friendlyName: "Pocket Ace authenticator",
                  });
                  if (error) throw error;
                  setMfa({
                    id: data.id,
                    qr: data.totp.qr_code,
                    secret: data.totp.secret,
                  });
                })
              }
            />
            {factors.map((f) => (
              <View key={f.id} style={{ gap: 8 }}>
                <Text style={s.muted}>
                  {f.friendly_name || "Authenticator"}
                </Text>
                <Button
                  secondary
                  title="Verify session / remove authenticator"
                  onPress={() => setPendingFactor(f.id)}
                />
              </View>
            ))}
          </>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Bank connections</Text>
        <Text style={s.muted}>
          Manual entry always works. Plaid Sandbox is a test integration; real
          bank connectivity requires provider approval. Pocket Ace never asks
          for banking passwords.
        </Text>
        {demo ? (
          <Text style={s.badge}>DEMO · No bank connected</Text>
        ) : (
          <>
            <Button
              secondary
              title="Check sandbox connection"
              onPress={() =>
                task(async () => {
                  setBank(await invoke("bank", { action: "status" }));
                })
              }
            />
            {bank && (
              <Text style={s.muted}>
                {bank.status} · Last sync: {bank.last_sync || "Never"}
              </Text>
            )}
            <Button
              secondary
              title="Create sandbox hosted connection"
              onPress={() =>
                task(async () => {
                  const result = await invoke("bank", {
                    action: "link",
                    mobile: Platform.OS !== "web",
                  });
                  if (result.url) {
                    await WebBrowser.openBrowserAsync(result.url);
                  } else
                    throw new Error(
                      "Provider did not return a hosted link URL. Configure a permitted hosted Link completion URI.",
                    );
                })
              }
            />
            <Button
              secondary
              title="Choose connected accounts"
              onPress={() =>
                task(async () => {
                  const result = await invoke("bank", { action: "accounts" });
                  setAccounts(result.accounts);
                  setSelected(result.selected);
                })
              }
            />
            <Button
              secondary
              title="Reconnect sandbox bank"
              onPress={() =>
                task(async () => {
                  const result = await invoke("bank", {
                    action: "reconnect",
                    mobile: Platform.OS !== "web",
                  });
                  if (result.url) await WebBrowser.openBrowserAsync(result.url);
                })
              }
            />
            {accounts.map((a) => (
              <Button
                key={a.id}
                secondary
                title={`${selected.includes(a.id) ? "✓ " : ""}${a.name} · ${a.mask || ""} · Bank balance ${money(a.balanceCents || 0)}`}
                onPress={() =>
                  setSelected((v) =>
                    v.includes(a.id)
                      ? v.filter((x) => x !== a.id)
                      : [...v, a.id],
                  )
                }
              />
            ))}
            {!!accounts.length && (
              <Button
                title="Save selected accounts"
                onPress={() =>
                  task(async () => {
                    await invoke("bank", {
                      action: "select",
                      accountIds: selected,
                    });
                    setMessage("Accounts selected.");
                  })
                }
              />
            )}
            <Button
              secondary
              title="Sync sandbox transactions"
              onPress={() =>
                task(async () => {
                  const result = await invoke("bank", { action: "sync" });
                  const { data: tx, error } = await supabase
                    .from("bank_transactions")
                    .select("*")
                    .eq("removed", false)
                    .order("date", { ascending: false });
                  if (error) throw error;
                  setBankTransactions(tx);
                  setMessage(`Synchronized ${result.count} transactions.`);
                })
              }
            />
            {bankTransactions.map((t) => (
              <View key={t.id} style={s.card}>
                <Text style={s.h3}>
                  {t.name} · {money(t.cents)}
                </Text>
                <Text style={s.muted}>
                  {t.date} · CAD · Imported from sandbox
                </Text>
                <Field
                  label={`Correct category for ${t.name}`}
                  defaultValue={t.manual_category || t.category}
                  onEndEditing={(e) =>
                    task(async () => {
                      const { error } = await supabase
                        .from("bank_transactions")
                        .update({ manual_category: e.nativeEvent.text })
                        .eq("id", t.id);
                      if (error) throw error;
                    })
                  }
                />
              </View>
            ))}
            <Button
              secondary
              title="Disconnect sandbox bank"
              onPress={() =>
                task(async () => {
                  await invoke("bank", { action: "disconnect" });
                  setBank(null);
                  setMessage("Bank disconnected and stored tokens removed.");
                })
              }
            />
          </>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Import transactions</Text>
        <Text style={s.muted}>
          CSV header: id,date,name,amount,category. Dates: YYYY-MM-DD. Amounts:
          positive CAD spending. Stable IDs prevent duplicates. Imports are
          historical transactions; they do not automatically become planned
          payments.
        </Text>
        <Button
          secondary
          title="Choose CSV file"
          onPress={() =>
            task(async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: ["text/csv", "text/comma-separated-values", "text/plain"],
                copyToCacheDirectory: true,
              });
              if (!result.canceled) {
                const text = await (await fetch(result.assets[0].uri)).text();
                setCsv(text);
                setPreview(parseCSV(text));
              }
            })
          }
        />
        <Field
          label="Or paste CSV"
          value={csv}
          onChangeText={setCsv}
          multiline
          maxLength={300000}
        />
        <Button
          secondary
          title="Preview import"
          onPress={() => task(async () => setPreview(parseCSV(csv)))}
        />
        {preview && (
          <>
            <Text style={s.muted}>
              {preview.length} rows ·{" "}
              {
                preview.filter(
                  (r) =>
                    !data.transactions.some(
                      (t) => t.externalId === r.externalId,
                    ),
                ).length
              }{" "}
              new
            </Text>
            {preview.slice(0, 5).map((r) => (
              <Text key={r.externalId} style={s.muted}>
                {r.date} · {r.name} · {money(r.cents)}
              </Text>
            ))}
            <Button
              title="Confirm import"
              onPress={() => {
                update((d) => ({
                  ...d,
                  transactions: [
                    ...d.transactions,
                    ...preview.filter(
                      (r) =>
                        !d.transactions.some(
                          (t) => t.externalId === r.externalId,
                        ),
                    ),
                  ],
                }));
                setPreview(null);
                setCsv("");
                setMessage("Imported without duplicate IDs.");
              }}
            />
          </>
        )}
        {data.transactions.map((t) => (
          <View key={t.externalId} style={{ gap: 6 }}>
            <Text style={s.h3}>
              {t.name} · {money(t.cents)}
            </Text>
            <Field
              label={`Category for ${t.name}`}
              value={t.category}
              onChangeText={(v) =>
                update((d) => ({
                  ...d,
                  transactions: d.transactions.map((x) =>
                    x.externalId === t.externalId ? { ...x, category: v } : x,
                  ),
                }))
              }
            />
            <Link
              title="Remove imported transaction"
              onPress={() =>
                update((d) => ({
                  ...d,
                  transactions: d.transactions.filter(
                    (x) => x.externalId !== t.externalId,
                  ),
                }))
              }
            />
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Your data belongs to you</Text>
        <Text style={s.muted}>
          Live data is protected by authentication, per-user database policies
          and private avatar storage when deployed. This is not end-to-end
          encryption. Demo data is stored locally. Financial context is off by
          default.
        </Text>
        <Button
          secondary
          title="Export my data (JSON)"
          onPress={() => task(exportData)}
        />
        <Button
          secondary
          title="Open administration"
          onPress={() => router.push("/admin")}
        />
        <Field
          label={
            demo
              ? "Type DELETE to erase demo data"
              : "Type DELETE to permanently delete your account"
          }
          value={deleteText}
          onChangeText={setDeleteText}
        />
        <Button
          secondary
          disabled={deleteText !== "DELETE" || busy}
          title={demo ? "Erase demo data" : "Delete account and all data"}
          onPress={() =>
            task(async () => {
              if (!demo) await invoke("account", { action: "delete" });
              else {
                const storage = (
                  await import("@react-native-async-storage/async-storage")
                ).default;
                await storage.removeItem("pocketace-demo");
              }
              await exit();
            })
          }
        />
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Need a hand?</Text>
        <Text style={s.muted}>
          No support address has been verified yet. For local setup and
          troubleshooting, use the README included with this project. Contact
          details in the pitch deck are historical placeholders.
        </Text>
      </View>
      <Button
        secondary
        title={demo ? "Leave demo" : "Sign out"}
        onPress={() => task(exit)}
      />
      <Sheet
        title="Set up authenticator"
        visible={!!mfa}
        onClose={() => setMfa(null)}
      >
        {mfa && (
          <>
            <Text style={s.body}>
              Add the secret to your authenticator app, then enter its six-digit
              code. Keep the secret private.
            </Text>
            {Platform.OS === "web" && (
              <Image
                source={{
                  uri: `data:image/svg+xml;utf8,${encodeURIComponent(mfa.qr)}`,
                }}
                style={{ width: 200, height: 200 }}
              />
            )}
            <Text selectable style={s.muted}>
              {mfa.secret}
            </Text>
            <Button
              secondary
              title="Copy setup secret"
              onPress={() => Clipboard.setStringAsync(mfa.secret)}
            />
            <Field
              label="Authenticator code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            {error && <Text style={s.error}>{error}</Text>}
            <Button
              title="Verify and enable"
              onPress={() =>
                task(async () => {
                  const { error } = await supabase.auth.mfa.challengeAndVerify({
                    factorId: mfa.id,
                    code,
                  });
                  if (error) throw error;
                  setMfa(null);
                  setCode("");
                  await loadFactors();
                  setMessage("Two-factor authentication enabled.");
                })
              }
            />
          </>
        )}
      </Sheet>
      <Sheet
        title="Verify authenticator"
        visible={!!pendingFactor}
        onClose={() => setPendingFactor("")}
      >
        <Field
          label="Current six-digit code"
          value={code}
          onChangeText={setCode}
        />
        {error && <Text style={s.error}>{error}</Text>}
        <Button
          title="Verify session"
          onPress={() =>
            task(async () => {
              const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: pendingFactor,
                code,
              });
              if (error) throw error;
              setMessage("Session verified.");
              setCode("");
            })
          }
        />
        <Button
          secondary
          title="Remove authenticator after verification"
          onPress={() =>
            task(async () => {
              const { error } = await supabase.auth.mfa.unenroll({
                factorId: pendingFactor,
              });
              if (error) throw error;
              setPendingFactor("");
              setCode("");
              await loadFactors();
            })
          }
        />
      </Sheet>
    </View>
  );
}
function LinkingURL() {
  return Platform.OS === "web" ? window.location.origin + "/" : "pocketace://";
}
