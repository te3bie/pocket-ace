import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { s, colors, Link, Button, Chips } from "../components/ui";
import { BudgetEditor, ExpenseEditor } from "../components/editors";
import {
  Expense,
  iso,
  money,
  monthBounds,
  monthCells,
  occurrences,
  totals,
  refundsFor,
} from "../domain/finance";
import { useStore } from "../lib/store";
export default function Calendar() {
  const { data, update } = useStore();
  const params = useLocalSearchParams<{ date?: string; expenseId?: string }>();
  useEffect(() => {
    if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      setSelected(params.date);
      setMonth(new Date(params.date + "T12:00:00"));
      setView("List");
    }
    if (params.expenseId) {
      const e = data.expenses.find((e) => e.id === params.expenseId);
      if (e) setEditor(e);
    }
  }, [params.date, params.expenseId]);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(iso(new Date()));
  const [editor, setEditor] = useState<Expense | true | null>(null);
  const [budget, setBudget] = useState<"once" | "monthly" | null>(null);
  const [view, setView] = useState("Calendar");
  const [message, setMessage] = useState("");
  const bounds = monthBounds(month),
    today = iso(new Date());
  return (
    <View style={s.page}>
      <View style={s.between}>
        <View>
          <Text style={s.eyebrow}>MAKE ROOM FOR WHAT MATTERS</Text>
          <Text style={[s.title, { marginTop: 8 }]}>Your payment plan</Text>
        </View>
      </View>
      <Chips values={["Calendar", "List"]} value={view} onChange={setView} />
      <View style={s.between}>
        <Link
          title="‹ Previous"
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        />
        <Text style={[s.h3, { color: colors.royal }]}>
          {month.toLocaleDateString("en-CA", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <Link
          title="Next ›"
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        />
      </View>
      {(["once", "monthly"] as const).map((kind) => {
        const expenses = data.expenses.filter((e) =>
          kind === "once" ? e.kind === "once" : e.kind !== "once",
        );
        const items = occurrences(expenses, ...bounds);
        const periodItems =
          kind === "once"
            ? occurrences(expenses, data.semesterStart, data.semesterEnd)
            : items;
        const summary = totals(
          periodItems,
          data.budgets[kind],
          refundsFor(
            data.entries,
            expenses,
            kind === "once" ? data.semesterStart : bounds[0],
            kind === "once" ? data.semesterEnd : bounds[1],
          ),
        );
        return (
          <View key={kind} style={{ gap: 12 }}>
            <View style={s.between}>
              <Text style={s.h2}>
                {kind === "once" ? "One-Time Payments" : "Monthly Expenses"}
              </Text>
              <Link title="Edit Details" onPress={() => setBudget(kind)} />
            </View>
            <View
              style={[
                s.between,
                { backgroundColor: colors.wash, padding: 12, borderRadius: 12 },
              ]}
            >
              <Text style={s.muted}>
                Budget <Text style={s.link}>{money(data.budgets[kind])}</Text>
              </Text>
              <Text
                style={[
                  s.muted,
                  { color: summary.remaining < 0 ? colors.red : colors.royal },
                ]}
              >
                Leftover {money(summary.remaining)}
              </Text>
            </View>
            <Text style={s.muted}>
              Planned {money(summary.planned)} · Actual paid, net of refunds{" "}
              {money(summary.actual)}
            </Text>
            {kind === "once" && (
              <Text style={s.muted}>
                Semester: {data.semesterStart} to {data.semesterEnd}
              </Text>
            )}
            {view === "Calendar" && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 15,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{ flexDirection: "row", backgroundColor: colors.wash }}
                >
                  {["S", "M", "T", "W", "T", "F", "S"].map((v, i) => (
                    <Text
                      key={i}
                      style={{
                        width: "14.2857%",
                        textAlign: "center",
                        paddingVertical: 11,
                        fontSize: 11,
                        fontWeight: "700",
                        color: colors.muted,
                      }}
                    >
                      {v}
                    </Text>
                  ))}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {monthCells(month).map((date, i) => {
                    const hits = items.filter((o) => o.date === date);
                    return (
                      <Pressable
                        key={i}
                        disabled={!date}
                        accessibilityRole="button"
                        accessibilityLabel={
                          date
                            ? `${date}, ${hits.length} payments`
                            : "Empty day"
                        }
                        onPress={() => setSelected(date!)}
                        style={{
                          width: "14.2857%",
                          minHeight: 64,
                          borderTopWidth: 1,
                          borderRightWidth: 1,
                          borderColor: colors.line,
                          alignItems: "center",
                          paddingVertical: 9,
                          backgroundColor:
                            selected === date ? "#EAF1FF" : "white",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: date === today ? colors.royal : colors.ink,
                            fontWeight: date === today ? "800" : "400",
                          }}
                        >
                          {date ? Number(date.slice(-2)) : ""}
                        </Text>
                        {!!hits.length && (
                          <View
                            style={{
                              marginTop: 8,
                              width: 6,
                              height: 6,
                              borderRadius: 4,
                              backgroundColor: hits.some(
                                (o) => o.date < today && !o.paid,
                              )
                                ? colors.red
                                : colors.blue,
                            }}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            <Text style={s.label}>
              {view === "List"
                ? "All payments this month"
                : `Payments on ${selected}`}
            </Text>
            {(view === "List"
              ? items
              : items.filter((o) => o.date === selected)
            ).map((o) => (
              <View key={o.key} style={s.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setEditor(o.expense)}
                >
                  <View style={s.between}>
                    <Text style={s.h3}>{o.expense.name}</Text>
                    <Text style={s.h3}>{money(o.expense.cents)}</Text>
                  </View>
                  <Text style={s.muted}>
                    {o.date} · {o.expense.category} ·{" "}
                    {o.paid ? "Paid" : o.date < today ? "Overdue" : "Planned"}
                  </Text>
                </Pressable>
                <Button
                  secondary
                  title={o.paid ? "Undo paid" : "Mark paid"}
                  onPress={() => {
                    update((d) => ({
                      ...d,
                      expenses: d.expenses.map((e) =>
                        e.id === o.expense.id
                          ? {
                              ...e,
                              paidAmounts: {
                                ...e.paidAmounts,
                                [o.date]: o.expense.cents,
                              },
                              paidDates: o.paid
                                ? e.paidDates.filter((x) => x !== o.date)
                                : [...e.paidDates, o.date],
                            }
                          : e,
                      ),
                    }));
                    setMessage(
                      o.paid
                        ? "Payment marked planned."
                        : "Payment marked paid. You can undo this here.",
                    );
                  }}
                />
              </View>
            ))}
            {!(
              view === "List" ? items : items.filter((o) => o.date === selected)
            ).length && (
              <Text style={s.muted}>
                No payments here. Add one when you’re ready.
              </Text>
            )}
          </View>
        );
      })}
      {message && (
        <Text accessibilityLiveRegion="polite" style={s.badge}>
          {message}
        </Text>
      )}
      <Button title="+ Add a payment" onPress={() => setEditor(true)} />
      {editor && (
        <ExpenseEditor
          expense={editor === true ? undefined : editor}
          date={selected}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {budget && <BudgetEditor kind={budget} onClose={() => setBudget(null)} />}
    </View>
  );
}
