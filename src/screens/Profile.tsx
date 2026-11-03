import { EntryEditor } from "../components/editors";
import { Entry } from "../domain/finance";
import React, { useState } from "react";
import { View, Text, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Button,
  Chips,
  Field,
  LineChart,
  Link,
  Logo,
  Sheet,
  colors,
  s,
} from "../components/ui";
import { Profile as ProfileType, uid, useStore } from "../lib/store";
import {
  cents,
  goalProgress,
  money,
  monthBounds,
  occurrences,
} from "../domain/finance";
import { supabase } from "../lib/supabase";
export default function Profile() {
  const { data, update, demo, session } = useStore();
  const [entryEdit, setEntryEdit] = useState<Entry | null>(null);
  const [edit, setEdit] = useState(false);
  const [p, setP] = useState(data.profile);
  const [financial, setFinancial] = useState({
    annualIncome: String(data.profile.annualIncome / 100),
    tuitionMin: String(data.profile.tuitionMin / 100),
    tuitionMax: String(data.profile.tuitionMax / 100),
  });
  const [goal, setGoal] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const months = Array.from(
    { length: 6 },
    (_, i) => new Date(new Date().getFullYear(), new Date().getMonth() + i, 1),
  );
  const values = months.map((m) =>
    occurrences(data.expenses, ...monthBounds(m)).reduce(
      (a, o) => a + o.expense.cents,
      0,
    ),
  );
  const field = (label: string, key: keyof ProfileType) => (
    <Field
      key={key}
      label={label}
      value={String(p[key] ?? "")}
      onChangeText={(v) => setP({ ...p, [key]: v })}
    />
  );
  const upload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(
          asset.mimeType || "image/jpeg",
        )
      )
        throw new Error("Choose a JPEG, PNG or WebP image.");
      if ((asset.fileSize || 0) > 2000000)
        throw new Error("Choose an image smaller than 2 MB.");
      if (demo) {
        update((d) => ({
          ...d,
          profile: {
            ...d.profile,
            avatar: `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`,
          },
        }));
        return;
      }
      const blob = await (await fetch(asset.uri)).arrayBuffer();
      const path = `${session!.user.id}/avatar`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, {
          upsert: true,
          contentType: asset.mimeType || "image/jpeg",
        });
      if (error) throw error;
      update((d) => ({ ...d, profile: { ...d.profile, avatar: path } }));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const [avatarUrl, setAvatarUrl] = useState("");
  React.useEffect(() => {
    if (!data.profile.avatar || demo) {
      setAvatarUrl(data.profile.avatar || "");
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(data.profile.avatar, 3600)
      .then(({ data }) => setAvatarUrl(data?.signedUrl || ""));
  }, [data.profile.avatar, demo]);
  return (
    <View style={s.page}>
      <View style={s.between}>
        <Text style={s.title}>My profile</Text>
        <Link title="Settings ⚙" onPress={() => router.push("/settings")} />
      </View>
      <View style={s.row}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 78, height: 78, borderRadius: 39 }}
          />
        ) : (
          <View
            style={{
              width: 78,
              height: 78,
              borderRadius: 39,
              backgroundColor: colors.wash,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Logo markOnly />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.h2}>
            {data.profile.name || "Make this space yours"}
          </Text>
          <Text style={s.muted}>
            {[data.profile.city, data.profile.province]
              .filter(Boolean)
              .join(", ")}
          </Text>
          <Text style={s.badge}>{data.profile.stage}</Text>
        </View>
      </View>
      <View style={s.between}>
        <Link title="Change image" onPress={upload} />
        <Link
          title="Remove image"
          onPress={async () => {
            if (!demo && data.profile.avatar)
              await supabase.storage
                .from("avatars")
                .remove([data.profile.avatar]);
            update((d) => ({ ...d, profile: { ...d.profile, avatar: null } }));
          }}
        />
        <Link
          title="Edit Profile"
          onPress={() => {
            setP(data.profile);
            setFinancial({
              annualIncome: String(data.profile.annualIncome / 100),
              tuitionMin: String(data.profile.tuitionMin / 100),
              tuitionMax: String(data.profile.tuitionMax / 100),
            });
            setEdit(true);
          }}
        />
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <View style={[s.card, { backgroundColor: colors.royal, borderWidth: 0 }]}>
        <Text style={{ color: "#C5DAFF", fontSize: 13 }}>
          Your university pathway
        </Text>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
          {data.profile.university || "Still exploring? That’s okay."}
        </Text>
        <Text style={{ color: "white", fontSize: 14 }}>
          {data.profile.program || "Add your program interests"}
        </Text>
        <Text style={{ color: "#DAE8FF", fontSize: 12 }}>
          Target annual tuition: {money(data.profile.tuitionMin)}–
          {money(data.profile.tuitionMax)}
        </Text>
      </View>
      <View style={[s.card, { backgroundColor: colors.pale, borderWidth: 0 }]}>
        <Text style={{ fontSize: 13, color: "#244572" }}>Employment</Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#183664" }}>
          {data.profile.employment === "Not employed"
            ? "No job needed to start planning"
            : data.profile.employer || data.profile.employment}
        </Text>
        <Text style={{ fontSize: 14, color: "#183664" }}>
          {data.profile.role || "Your plan works with zero income, too."}
        </Text>
        <Text style={{ fontSize: 12, color: "#244572" }}>
          Entered annual income: {money(data.profile.annualIncome)}
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Projected Spending</Text>
        <Text style={s.muted}>
          Planned payments over the next six months · CAD
        </Text>
        <LineChart values={values} />
        <View style={s.between}>
          {months.map((m, i) => (
            <View
              key={i}
              style={{ gap: 4, alignItems: "flex-start", width: "30%" }}
            >
              <Text style={{ fontSize: 10, color: colors.muted }}>
                {m.toLocaleDateString("en-CA", { month: "short" })}
              </Text>
              <Text style={{ fontSize: 10, color: colors.ink }}>
                {money(values[i])}
              </Text>
            </View>
          ))}
        </View>
        <Text style={s.muted}>
          Estimate using entered one-time payments and recurring schedules. No
          machine learning or assumed income. Annual income is context only; add
          dated income to forecast cash.
        </Text>
      </View>
      <View style={s.between}>
        <Text style={s.h2}>Savings goals</Text>
        <Link title="+ Add goal" onPress={() => setGoal(true)} />
      </View>
      {data.goals.map((g) => (
        <View key={g.id} style={s.card}>
          <Text style={s.h3}>{g.name}</Text>
          <Text style={s.muted}>
            {money(g.saved)} / {money(g.target)} ·{" "}
            {Math.round(goalProgress(g) * 100)}%
          </Text>
          <Field
            label={`Saved toward ${g.name} (CAD)`}
            defaultValue={String(g.saved / 100)}
            keyboardType="decimal-pad"
            onEndEditing={(e) => {
              try {
                const amount = cents(e.nativeEvent.text);
                update((d) => ({
                  ...d,
                  goals: d.goals.map((x) =>
                    x.id === g.id ? { ...x, saved: amount } : x,
                  ),
                }));
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
          <Link
            title="Remove goal"
            onPress={() =>
              update((d) => ({
                ...d,
                goals: d.goals.filter((x) => x.id !== g.id),
              }))
            }
          />
        </View>
      ))}
      <Text style={s.muted}>
        Goals track earmarked savings; they do not add money to your balance.
      </Text>
      <Text style={s.h2}>Income and savings history</Text>
      {data.entries.map((e) => (
        <View key={e.id} style={s.between}>
          <View>
            <Text style={s.h3}>
              {e.name} · {money(e.cents)}
            </Text>
            <Text style={s.muted}>
              {e.date} · {e.type}
            </Text>
            <Link title="Edit entry" onPress={() => setEntryEdit(e)} />
          </View>
          <Link
            title="Delete"
            onPress={() =>
              update((d) => ({
                ...d,
                entries: d.entries.filter((x) => x.id !== e.id),
              }))
            }
          />
        </View>
      ))}
      {entryEdit && (
        <EntryEditor entry={entryEdit} onClose={() => setEntryEdit(null)} />
      )}
      <Sheet
        title="Edit your profile"
        visible={edit}
        onClose={() => setEdit(false)}
      >
        {field("Name", "name")}
        {field("City", "city")}
        {field("Province", "province")}
        <Chips
          values={["High school", "Undergraduate", "Graduate", "Other"]}
          value={p.stage}
          onChange={(v) => setP({ ...p, stage: v })}
        />
        {field("University preference (optional)", "university")}
        {field("Program interest", "program")}
        <Chips
          values={["Not employed", "Part-time", "Full-time", "Self-employed"]}
          value={p.employment}
          onChange={(v) => setP({ ...p, employment: v })}
        />
        {p.employment !== "Not employed" && (
          <>
            {field("Employer (optional)", "employer")}
            {field("Role (optional)", "role")}
          </>
        )}
        {(["annualIncome", "tuitionMin", "tuitionMax"] as const).map((key) => (
          <Field
            key={key}
            label={`${key === "annualIncome" ? "Annual income" : key === "tuitionMin" ? "Minimum tuition" : "Maximum tuition"} (CAD)`}
            value={financial[key]}
            onChangeText={(v) => setFinancial({ ...financial, [key]: v })}
            keyboardType="decimal-pad"
          />
        ))}
        {error && <Text style={s.error}>{error}</Text>}
        <Button
          title="Save profile"
          onPress={() => {
            try {
              const amounts = {
                annualIncome: cents(financial.annualIncome),
                tuitionMin: cents(financial.tuitionMin),
                tuitionMax: cents(financial.tuitionMax),
              };
              if (amounts.tuitionMin > amounts.tuitionMax) {
                setError("Minimum tuition must not exceed maximum.");
                return;
              }
              update((d) => ({
                ...d,
                profile: {
                  ...p,
                  ...amounts,
                  name: p.name.trim(),
                  employer: p.employment === "Not employed" ? "" : p.employer,
                  role: p.employment === "Not employed" ? "" : p.role,
                },
                onboarded: true,
              }));
              setEdit(false);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      </Sheet>
      <Sheet
        title="Save for your next chapter"
        visible={goal}
        onClose={() => setGoal(false)}
      >
        <Field label="Goal name" value={name} onChangeText={setName} />
        <Field label="Target (CAD)" value={target} onChangeText={setTarget} />
        <Field
          label="Already saved (CAD)"
          value={saved}
          onChangeText={setSaved}
        />
        {error && <Text style={s.error}>{error}</Text>}
        <Button
          title="Create goal"
          onPress={() => {
            try {
              if (!name.trim()) throw new Error("Name your goal.");
              const g = {
                id: uid(),
                name: name.trim(),
                target: cents(target),
                saved: cents(saved || "0"),
              };
              update((d) => ({ ...d, goals: [...d.goals, g] }));
              setGoal(false);
              setName("");
              setTarget("");
              setSaved("");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        />
      </Sheet>
    </View>
  );
}
