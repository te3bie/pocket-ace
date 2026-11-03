import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, Linking } from "react-native";
import { Button, Chips, Field, Link, Sheet, colors, s } from "../components/ui";
import {
  demoCatalog,
  opportunitySchema,
  Filters,
  Opportunity,
  searchCatalog,
} from "../domain/catalog";
import { money, parseDate } from "../domain/finance";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
const empty: Filters = {
  query: "",
  type: "",
  location: "",
  level: "",
  maxTuition: 10000000000,
  minAward: 0,
  deadlineBefore: "",
  institution: "",
  program: "",
  eligibility: "",
};
export default function Discover() {
  const { data, update, demo } = useStore();
  const params = useLocalSearchParams<{ opportunityId?: string }>();
  const [campaigns, setCampaigns] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Opportunity[]>(demo ? demoCatalog : []);
  const [query, setQuery] = useState("");
  const [scholarQuery, setScholarQuery] = useState("");
  const [filters, setFilters] = useState(empty);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detail, setDetail] = useState<Opportunity | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Explore");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (params.opportunityId) {
      setTab("Saved");
      const found = rows.find((o) => o.id === params.opportunityId);
      if (found) setDetail(found);
    }
  }, [params.opportunityId, rows]);
  const load = async () => {
    if (demo) {
      setRows(demoCatalog);
      return;
    }
    setLoading(true);
    const { data: result, error } = await supabase
      .from("opportunities")
      .select("data")
      .eq("published", true);
    setLoading(false);
    if (error) setError(error.message);
    else {
      const { data: ads, error: ae } = await supabase.rpc("active_campaigns");
      if (ae) setError(ae.message);
      const active = Object.fromEntries(
        (ads || []).map(
          (a: { opportunity_id: string; campaign_id: string }) => [
            a.opportunity_id,
            a.campaign_id,
          ],
        ),
      );
      setCampaigns(active);
      const valid = result.map((r) => opportunitySchema.safeParse(r.data));
      if (valid.some((r) => !r.success))
        setError("Some listings failed validation and were hidden for review.");
      setRows(
        valid.flatMap((r) =>
          r.success ? [{ ...r.data, sponsored: !!active[r.data.id] }] : [],
        ),
      );
    }
  };
  useEffect(() => {
    load();
  }, [demo]);
  const card = (o: Opportunity) => (
    <View key={o.id} style={s.card}>
      <View style={s.between}>
        <Text style={s.badge}>
          {o.type.toUpperCase()}
          {o.demo ? " · FICTIONAL DEMO" : ""}
        </Text>
        {o.sponsored && <Text style={s.badge}>Sponsored</Text>}
      </View>
      <Text style={s.h3}>{o.name}</Text>
      <Text style={[s.body, { color: colors.royal }]}>{o.provider}</Text>
      <Text style={s.muted}>{o.summary}</Text>
      <Text style={s.muted}>
        {o.location}
        {o.award !== null ? ` · ${money(o.award)} example award` : ""}
        {o.tuition !== null
          ? ` · ${money(o.tuition)} ${o.demo ? "example" : "listed"} tuition`
          : ""}
      </Text>
      <Text style={s.muted}>
        Why shown:{" "}
        {data.profile.program &&
        o.program.toLowerCase().includes(data.profile.program.toLowerCase())
          ? "Matches your program interest"
          : o.location.includes(data.profile.province)
            ? "Matches your province"
            : "Explore a different pathway"}
        . Eligibility is not guaranteed.
      </Text>
      <View style={s.between}>
        <Link title="View details →" onPress={() => setDetail(o)} />
        <Link
          title={data.saved[o.id] ? "Saved ✓" : "Save +"}
          onPress={() =>
            update((d) => {
              const saved = { ...d.saved };
              if (saved[o.id]) delete saved[o.id];
              else
                saved[o.id] = {
                  status: "Interested",
                  notes: "",
                  reminderDate: null,
                };
              return { ...d, saved };
            })
          }
        />
      </View>
    </View>
  );
  return (
    <View style={s.page}>
      <View>
        <Text style={s.eyebrow}>OPEN DOORS TO YOUR NEXT CHAPTER</Text>
        <View style={s.between}>
          <Text style={[s.title, { marginTop: 8 }]}>Find your opportunity</Text>
          <Link title="Filters ☷" onPress={() => setFilterOpen(true)} />
        </View>
      </View>
      <Chips
        values={["Explore", "Saved", "Extracurriculars"]}
        value={tab}
        onChange={setTab}
      />
      {loading && <Text style={s.muted}>Loading opportunities…</Text>}
      {error && (
        <>
          <Text style={s.error}>{error}</Text>
          <Button secondary title="Retry" onPress={load} />
        </>
      )}
      {tab === "Explore" ? (
        <>
          {[
            {
              title: "Program Finder",
              q: query,
              set: setQuery,
              types: ["program"],
            },
            {
              title: "Scholarship and Bursary Finder",
              q: scholarQuery,
              set: setScholarQuery,
              types: ["scholarship", "bursary"],
            },
          ].map((section) => {
            const found = searchCatalog(rows, {
              ...filters,
              query: section.q,
            }).filter((o) => section.types.includes(o.type));
            return (
              <View key={section.title} style={{ gap: 14 }}>
                <Text style={s.h2}>{section.title}</Text>
                <Field
                  label={`Search ${section.title.toLowerCase()}`}
                  placeholder="Program, institution or keyword"
                  value={section.q}
                  onChangeText={section.set}
                  onSubmitEditing={() => section.set(section.q.trim())}
                  returnKeyType="search"
                />
                <View style={s.between}>
                  <Text style={s.muted}>
                    {section.q ? "Search results" : "Recommended For You"} ·{" "}
                    {found.length}
                  </Text>
                  <Link title="Clear" onPress={() => section.set("")} />
                </View>
                {found.map(card)}
                {!found.length && (
                  <Text style={s.muted}>
                    {demo
                      ? "No matches. Try a broader search."
                      : "No reviewed listings yet. Verified opportunities will appear after an administrator publishes them."}
                  </Text>
                )}
              </View>
            );
          })}
        </>
      ) : (
        <>
          {searchCatalog(rows, filters)
            .filter((o) =>
              tab === "Saved"
                ? !!data.saved[o.id]
                : o.type === "extracurricular",
            )
            .map(card)}
          {tab === "Saved" && !Object.keys(data.saved).length && (
            <Text style={s.muted}>
              Save an opportunity to start your application shortlist.
            </Text>
          )}
        </>
      )}
      <Sheet
        title="Refine your search"
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
      >
        <Field
          label="Location"
          value={filters.location}
          onChangeText={(v) => setFilters({ ...filters, location: v })}
        />
        <Field
          label="Institution/provider"
          value={filters.institution}
          onChangeText={(v) => setFilters({ ...filters, institution: v })}
        />
        <Field
          label="Program interest"
          value={filters.program}
          onChangeText={(v) => setFilters({ ...filters, program: v })}
        />
        <Field
          label="Eligibility keyword"
          value={filters.eligibility}
          onChangeText={(v) => setFilters({ ...filters, eligibility: v })}
        />
        <Chips
          values={["", "High school", "Undergraduate", "Graduate"]}
          value={filters.level}
          onChange={(v) => setFilters({ ...filters, level: v })}
        />
        <Field
          label="Maximum tuition (CAD; blank for any)"
          keyboardType="numeric"
          value={
            filters.maxTuition === 10000000000
              ? ""
              : String(filters.maxTuition / 100)
          }
          onChangeText={(v) =>
            setFilters({
              ...filters,
              maxTuition: v ? Math.max(0, Number(v) || 0) * 100 : 10000000000,
            })
          }
        />
        <Field
          label="Minimum award (CAD)"
          keyboardType="numeric"
          value={String(filters.minAward / 100)}
          onChangeText={(v) =>
            setFilters({
              ...filters,
              minAward: Math.max(0, Number(v) || 0) * 100,
            })
          }
        />
        <Field
          label="Deadline on/before (YYYY-MM-DD)"
          value={filters.deadlineBefore}
          onChangeText={(v) => setFilters({ ...filters, deadlineBefore: v })}
        />
        <Button
          title="Show results"
          onPress={() => {
            try {
              if (filters.deadlineBefore) parseDate(filters.deadlineBefore);
              setFilterOpen(false);
              setError("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
        <Button
          secondary
          title="Reset filters"
          onPress={() => setFilters(empty)}
        />
      </Sheet>
      {detail && (
        <Sheet title={detail.name} visible onClose={() => setDetail(null)}>
          <Text style={s.h3}>{detail.provider}</Text>
          <Text style={s.body}>{detail.summary}</Text>
          <Text style={s.muted}>{detail.eligibility}</Text>
          <Text style={s.muted}>
            Academic year: {detail.academicYear}
            {"\n"}Verified:{" "}
            {detail.verifiedAt || "Not verified — fictional demo"}
            {"\n"}Deadline: {detail.deadline || "Not provided"}
            {"\n"}
            {detail.demo
              ? "This is fictional data. There is no real application."
              : "Always confirm current requirements at the official source."}
          </Text>
          {detail.url && !detail.demo && (
            <Button
              title="Open official application ↗"
              onPress={async () => {
                if (campaigns[detail.id])
                  await supabase.rpc("record_campaign_click", {
                    campaign: campaigns[detail.id],
                  });
                Linking.openURL(detail.url!).catch((e) => setError(e.message));
              }}
            />
          )}
          <Button
            secondary
            title={
              data.saved[detail.id] ? "Remove from saved" : "Save opportunity"
            }
            onPress={() =>
              update((d) => {
                const saved = { ...d.saved };
                if (saved[detail.id]) delete saved[detail.id];
                else
                  saved[detail.id] = {
                    status: "Interested",
                    notes: "",
                    reminderDate: null,
                  };
                return { ...d, saved };
              })
            }
          />
          {data.saved[detail.id] && (
            <>
              <Text style={s.label}>Application tracker</Text>
              <Chips
                values={[
                  "Interested",
                  "Preparing",
                  "Applied",
                  "Awarded",
                  "Closed",
                ]}
                value={data.saved[detail.id].status}
                onChange={(v) =>
                  update((d) => ({
                    ...d,
                    saved: {
                      ...d.saved,
                      [detail.id]: { ...d.saved[detail.id], status: v },
                    },
                  }))
                }
              />
              <Field
                label="Application notes"
                value={data.saved[detail.id].notes}
                onChangeText={(v) =>
                  update((d) => ({
                    ...d,
                    saved: {
                      ...d.saved,
                      [detail.id]: { ...d.saved[detail.id], notes: v },
                    },
                  }))
                }
              />
              <Field
                label="Reminder date (YYYY-MM-DD; optional)"
                value={data.saved[detail.id].reminderDate || ""}
                onChangeText={(v) =>
                  update((d) => ({
                    ...d,
                    saved: {
                      ...d.saved,
                      [detail.id]: {
                        ...d.saved[detail.id],
                        reminderDate: v || null,
                      },
                    },
                  }))
                }
              />
            </>
          )}
        </Sheet>
      )}
    </View>
  );
}
