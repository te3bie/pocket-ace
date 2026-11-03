import React, { useState } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { colors, s, Link, Pie, Button } from "../components/ui";
import { BalanceEditor, EntryEditor } from "../components/editors";
import { useStore } from "../lib/store";
import {
  iso,
  money,
  monthBounds,
  occurrences,
  totals,
  projectedBalance,
  cashProjection,
  refundsFor,
  goalProgress,
} from "../domain/finance";
export default function Home() {
  const { data } = useStore();
  const narrow = useWindowDimensions().width < 350;
  const [edit, setEdit] = useState(false);
  const [entry, setEntry] = useState(false);
  const now = new Date(),
    today = iso(now),
    bounds = monthBounds(now);
  const all = occurrences(
    data.expenses,
    data.balanceDate,
    data.semesterEnd > bounds[1] ? data.semesterEnd : bounds[1],
  );
  const futureIncome = data.entries
    .filter(
      (e) =>
        e.type === "income" && e.date > data.balanceDate && e.date <= bounds[1],
    )
    .reduce((a, e) => a + e.cents, 0);
  const monthly = occurrences(
    data.expenses.filter((e) => e.kind !== "once"),
    ...bounds,
  );
  const once = occurrences(
    data.expenses.filter((e) => e.kind === "once"),
    data.semesterStart,
    data.semesterEnd,
  );
  return (
    <View style={s.page}>
      <View>
        <Text style={s.eyebrow}>
          {now
            .toLocaleDateString("en-CA", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
            .toUpperCase()}
        </Text>
        <Text style={[s.title, { marginTop: 9 }]}>
          Your future starts here.
        </Text>
        <Text style={[s.muted, { marginTop: 6 }]}>
          A little planning. A lot more possibility.
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.pale,
          borderRadius: 23,
          padding: 23,
          overflow: "hidden",
        }}
      >
        <View style={s.between}>
          <View>
            <Text style={{ fontSize: 14, color: "#183664" }}>
              Current balance
            </Text>
            <Text
              style={{
                fontSize: narrow ? 30 : 40,
                fontWeight: "800",
                color: "#183664",
                letterSpacing: -1,
                marginVertical: 7,
              }}
            >
              {money(data.balance)}
            </Text>
            <Text style={{ fontSize: 11, color: "#294873" }}>
              Entered balance · CAD · {data.balanceDate}
            </Text>
          </View>
          {!narrow && (
            <View
              style={{
                width: 68,
                height: 72,
                transform: [{ rotate: "-10deg" }],
                borderRadius: 15,
                borderWidth: 3,
                borderColor: "#4669F3",
                backgroundColor: "#DDEBFF",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 32, color: colors.blue }}>▱</Text>
            </View>
          )}
        </View>
        <Link title="Edit Details  ↗" onPress={() => setEdit(true)} />
      </View>
      <View style={s.row}>
        {[
          { title: "Go to\nProfile", icon: "◎", path: "/profile" },
          { title: "View\nScholarships", icon: "♧", path: "/discover" },
        ].map((item) => (
          <Pressable
            key={item.path}
            accessibilityRole="button"
            onPress={() => router.push(item.path as any)}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.blue,
              borderRadius: 18,
              padding: 18,
              minHeight: 94,
              opacity: pressed ? 0.7 : 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            })}
          >
            <Text
              style={{
                fontSize: 16,
                lineHeight: 22,
                fontWeight: "600",
                color: "white",
              }}
            >
              {item.title}
            </Text>
            <Text style={{ fontSize: 29, color: "white" }}>{item.icon}</Text>
          </Pressable>
        ))}
      </View>
      {[
        { title: "One-Time Payments", items: once, kind: "once" },
        { title: "Monthly Expenses", items: monthly, kind: "monthly" },
      ].map((section) => {
        const upcoming = section.items.find((o) => !o.paid && o.date >= today);
        const summary = totals(
          section.items,
          data.budgets[section.kind as "once" | "monthly"],
          refundsFor(
            data.entries,
            data.expenses.filter((e) =>
              section.kind === "once" ? e.kind === "once" : e.kind !== "once",
            ),
            section.kind === "once" ? data.semesterStart : bounds[0],
            section.kind === "once" ? data.semesterEnd : bounds[1],
          ),
        );
        const values = section.items.map((o) => o.expense.cents);
        return (
          <View key={section.kind} style={{ gap: 15 }}>
            <View style={s.between}>
              <Text style={s.h2}>{section.title}</Text>
              <Text style={s.badge}>{section.items.length} planned</Text>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={s.muted}>Upcoming payment</Text>
                <Text style={[s.h3, { color: colors.royal }]}>
                  {upcoming?.expense.name || "Nothing coming up"}
                </Text>
                <Text style={s.body}>
                  {upcoming
                    ? money(upcoming.expense.cents)
                    : "You’re all caught up"}
                </Text>
                {upcoming && (
                  <Text
                    style={[
                      s.muted,
                      {
                        backgroundColor: "#EAF4FF",
                        alignSelf: "flex-start",
                        padding: 4,
                        borderRadius: 5,
                      },
                    ]}
                  >
                    {new Date(upcoming.date + "T12:00:00").toLocaleDateString(
                      "en-CA",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </Text>
                )}
                <Link
                  title="See All  →"
                  onPress={() =>
                    router.push({
                      pathname: "/calendar",
                      params: { section: section.kind },
                    })
                  }
                />
              </View>
              <Pie values={values} size={narrow ? 95 : 138} />
            </View>
            <View style={[s.row, { flexWrap: "wrap", gap: 12 }]}>
              {section.items.slice(0, 3).map((o, i) => (
                <View key={o.key} style={[s.row, { gap: 5 }]}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: [colors.blue, colors.pale, colors.cyan][
                        i
                      ],
                    }}
                  />
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {o.expense.name}
                  </Text>
                </View>
              ))}
            </View>
            <View style={s.between}>
              <Text style={s.muted}>
                Budget {money(data.budgets[section.kind as "once" | "monthly"])}
              </Text>
              <Text
                style={[
                  s.muted,
                  { color: summary.remaining < 0 ? colors.red : colors.royal },
                ]}
              >
                {summary.remaining < 0 ? "Over budget" : "Left to allocate"}{" "}
                {money(Math.abs(summary.remaining))}
              </Text>
            </View>
            <View style={s.divider} />
          </View>
        );
      })}
      <View style={s.card}>
        <Text style={s.eyebrow}>LOOKING AHEAD</Text>
        <Text style={s.h3}>Projected month-end cash</Text>
        <Text style={[s.title, { color: colors.royal }]}>
          {money(
            cashProjection(
              data.balance,
              data.balanceDate,
              bounds[1],
              all,
              data.entries,
            ),
          )}
        </Text>
        <Text style={s.muted}>
          Estimate from your balance snapshot, future income and unpaid payments
          through month end. The snapshot is end-of-day cash; later paid and
          unpaid payments are deducted once. No bank account balances are added.
        </Text>
        <Button
          secondary
          title="Add income, savings or refund"
          onPress={() => setEntry(true)}
        />
      </View>
      {data.goals.length > 0 && (
        <View style={{ gap: 14 }}>
          <View style={s.between}>
            <Text style={s.h2}>Small steps, big goals</Text>
            <Link title="Manage →" onPress={() => router.push("/profile")} />
          </View>
          {data.goals.map((g) => (
            <View key={g.id} style={s.card}>
              <View style={s.between}>
                <Text style={s.h3}>{g.name}</Text>
                <Text style={s.link}>{Math.round(goalProgress(g) * 100)}%</Text>
              </View>
              <View
                style={{
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colors.line,
                }}
              >
                <View
                  style={{
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.cyan,
                    width: `${goalProgress(g) * 100}%`,
                  }}
                />
              </View>
              <Text style={s.muted}>
                {money(g.saved)} of {money(g.target)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {edit && <BalanceEditor onClose={() => setEdit(false)} />}{" "}
      {entry && <EntryEditor onClose={() => setEntry(false)} />}
    </View>
  );
}
