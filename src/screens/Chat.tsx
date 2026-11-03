import React, { useState } from "react";
import { View, Text } from "react-native";
import { Button, Chips, Field, Robot, colors, s } from "../components/ui";
import { useStore } from "../lib/store";
import { invoke } from "../lib/supabase";
import { money, monthBounds, occurrences, totals } from "../domain/finance";
export default function Chat() {
  const { data, update, demo } = useStore();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState("");
  const send = async (text: string, retry = false) => {
    if (!text.trim() || busy) return;
    const history = retry
      ? data.chats
      : data.chats.concat({ role: "user" as const, content: text.trim() });
    if (!retry) update((d) => ({ ...d, chats: history }));
    setInput("");
    setLast(text);
    setBusy(true);
    setError("");
    try {
      let content: string;
      if (demo) {
        const t = totals(
          occurrences(data.expenses, ...monthBounds(new Date())),
          data.budgets.monthly,
        );
        content = `Demo budget guide (not live AI): your planned payments this month total ${money(t.planned)}. Keep semester fees separate from everyday spending. You can review each payment in Calendar and adjust your budget there. Opportunities in this demo are fictional; check official sources before applying.`;
      } else {
        const result = await invoke("pocketpal", {
          messages: history.slice(-12),
          includeFinancialContext: data.settings.financialContext,
        });
        content = result.content;
      }
      update((d) => ({
        ...d,
        chats: [...d.chats, { role: "assistant", content }],
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.page}>
      <View style={s.row}>
        <View
          style={{ backgroundColor: colors.cyan, borderRadius: 25, padding: 7 }}
        >
          <Robot />
        </View>
        <View>
          <Text style={s.title}>PocketPal</Text>
          <Text style={s.muted}>
            {demo
              ? "Demo budget guide · scripted, not AI"
              : "Your student planning assistant"}
          </Text>
        </View>
      </View>
      <Text style={s.muted}>
        Ask about budgeting and planning. PocketPal never changes your records.
        Review official sources for opportunity requirements.
      </Text>
      <Chips
        values={["Financial context off", "Financial context on"]}
        value={
          data.settings.financialContext
            ? "Financial context on"
            : "Financial context off"
        }
        onChange={(v) =>
          update((d) => ({
            ...d,
            settings: {
              ...d.settings,
              financialContext: v === "Financial context on",
            },
          }))
        }
      />
      <Text style={s.muted}>
        Optional: share calculated budget totals only with the configured AI
        provider. Names, employer, bank details and transaction descriptions are
        excluded.
      </Text>
      {!data.chats.length && (
        <View style={s.card}>
          <Text style={s.h2}>Let’s make a plan.</Text>
          {[
            "How can I plan a semester budget?",
            "How do I build an emergency fund?",
            "What should I check before applying?",
          ].map((q) => (
            <Button key={q} secondary title={q} onPress={() => send(q)} />
          ))}
        </View>
      )}
      {data.chats.map((m, i) => (
        <View
          key={i}
          style={[
            s.card,
            {
              backgroundColor: m.role === "user" ? "#EDF3FF" : "white",
              marginLeft: m.role === "user" ? 30 : 0,
              marginRight: m.role === "assistant" ? 20 : 0,
            },
          ]}
        >
          <Text style={s.eyebrow}>
            {m.role === "user" ? "YOU" : "POCKETPAL"}
          </Text>
          <Text selectable style={s.body}>
            {m.content}
          </Text>
        </View>
      ))}
      {busy && (
        <Text accessibilityLiveRegion="polite" style={s.muted}>
          PocketPal is thinking…
        </Text>
      )}
      {error && (
        <>
          <Text style={s.error}>{error}</Text>
          <Button
            secondary
            title="Retry last message"
            onPress={() => send(last, true)}
          />
        </>
      )}
      <Field
        label="Your question"
        value={input}
        onChangeText={setInput}
        multiline
        maxLength={1500}
        placeholder="What’s on your mind?"
      />
      <Button
        title={busy ? "Thinking…" : "Send message ↑"}
        disabled={busy || !input.trim()}
        onPress={() => send(input)}
      />
      <Button
        secondary
        title="Delete conversation history"
        onPress={() => update((d) => ({ ...d, chats: [] }))}
      />
      <Text style={s.muted}>
        Avoid sharing passwords, account numbers or sensitive personal details.
        AI can make mistakes.
      </Text>
    </View>
  );
}
