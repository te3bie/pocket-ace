import { opportunitySchema } from "../domain/catalog";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, Field, s } from "../components/ui";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
export default function Admin() {
  const { demo } = useStore();
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [json, setJson] = useState("");
  const [campaign, setCampaign] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  async function load() {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    setRows(data);
    const { data: m, error: e } = await supabase.rpc("admin_metrics");
    if (e) throw e;
    setMetrics(m);
  }
  useEffect(() => {
    if (demo) return;
    supabase.rpc("is_admin").then(async ({ data, error }) => {
      if (error) setError(error.message);
      if (data) {
        setAllowed(true);
        try {
          await load();
        } catch (e) {
          setError((e as Error).message);
        }
      }
    });
  }, []);
  if (!allowed)
    return (
      <View style={s.page}>
        <Text style={s.title}>Administration</Text>
        <Text style={s.muted}>
          {demo
            ? "Administration requires a live account and a server-granted admin role."
            : "Only server-granted administrators can access this section."}
        </Text>
        {error && <Text style={s.error}>{error}</Text>}
      </View>
    );
  return (
    <View style={s.page}>
      <Text style={s.title}>Catalog & operations</Text>
      {error && <Text style={s.error}>{error}</Text>}
      {message && <Text style={s.badge}>{message}</Text>}
      <Text style={s.muted}>
        Review official source URLs, academic year, eligibility and verification
        date before publication. No private financial records are available
        here.
      </Text>
      <Text style={s.h2}>Aggregate metrics</Text>
      <Text selectable style={s.body}>
        {JSON.stringify(metrics, null, 2)}
      </Text>
      <Field
        label="Opportunity JSON (see docs/CATALOG.md)"
        multiline
        value={json}
        onChangeText={setJson}
      />
      <Button
        title="Save reviewed catalog record"
        onPress={async () => {
          try {
            const o = opportunitySchema.parse(JSON.parse(json));
            if (
              !o.id ||
              !o.name ||
              !o.provider ||
              !o.url?.startsWith("https://") ||
              !o.verifiedAt ||
              !o.academicYear ||
              o.demo
            )
              throw new Error(
                "Real records require ID, name, provider, HTTPS official URL, verification date, academic year and demo=false.",
              );
            const { error } = await supabase
              .from("opportunities")
              .upsert({ id: o.id, data: o, published: false });
            if (error) throw error;
            setMessage("Saved as draft. Review before publishing.");
            await load();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      {rows.map((o) => (
        <View key={o.id} style={s.card}>
          <Text style={s.h3}>{o.data.name}</Text>
          <Text style={s.muted}>
            {o.published ? "Published" : "Draft"} · Verified{" "}
            {o.data.verifiedAt || "never"} · Deadline{" "}
            {o.data.deadline || "not supplied"}
          </Text>
          <Button
            secondary
            title="Edit JSON"
            onPress={() => setJson(JSON.stringify(o.data, null, 2))}
          />
          <Button
            secondary
            title={o.published ? "Unpublish" : "Publish after review"}
            onPress={async () => {
              const { error } = await supabase
                .from("opportunities")
                .update({ published: !o.published })
                .eq("id", o.id);
              if (error) setError(error.message);
              else await load();
            }}
          />
        </View>
      ))}
      <Text style={s.h2}>Sponsored campaigns</Text>
      <Text style={s.muted}>
        Disabled by default. Use only approved, clearly labeled placements. No
        financial targeting. Billing/invoicing is external and requires owner
        configuration.
      </Text>
      <Field
        label="Campaign JSON: id, opportunity_id, enabled, starts_at, ends_at"
        multiline
        value={campaign}
        onChangeText={setCampaign}
      />
      <Button
        secondary
        title="Save campaign configuration"
        onPress={async () => {
          try {
            const c = JSON.parse(campaign);
            const { error } = await supabase.from("campaigns").upsert(c);
            if (error) throw error;
            setMessage("Campaign saved.");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </View>
  );
}
