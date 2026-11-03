import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chips, Field, Sheet, s } from "./ui";
import { Entry, Expense, cents, iso, parseDate } from "../domain/finance";
import { uid, useStore } from "../lib/store";
export function ExpenseEditor({
  expense,
  date,
  onClose,
}: {
  expense?: Expense;
  date?: string;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [name, setName] = useState(expense?.name || "");
  const [amount, setAmount] = useState(
    expense ? String(expense.cents / 100) : "",
  );
  const [due, setDue] = useState(expense?.date || date || iso(new Date()));
  const [kind, setKind] = useState(expense?.kind || "once");
  const [category, setCategory] = useState(expense?.category || "Education");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [reminder, setReminder] = useState(expense?.reminder || false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet
      title={expense ? "Edit expense" : "Plan an expense"}
      visible
      onClose={onClose}
    >
      <Field
        label="Payment name"
        value={name}
        onChangeText={setName}
        maxLength={100}
      />
      <Field
        label="Amount (CAD)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Field label="Due date (YYYY-MM-DD)" value={due} onChangeText={setDue} />
      <Chips
        values={["once", "monthly", "weekly"]}
        value={kind}
        onChange={(v) => setKind(v as Expense["kind"])}
      />
      <Field
        label="Category"
        value={category}
        onChangeText={setCategory}
        maxLength={60}
      />
      <Field
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
      />
      <Chips
        values={["Reminder off", "Reminder on"]}
        value={reminder ? "Reminder on" : "Reminder off"}
        onChange={(v) => setReminder(v === "Reminder on")}
      />
      {error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Save expense"
        onPress={() => {
          try {
            parseDate(due);
            if (!name.trim() || !category.trim())
              throw new Error("Add a name and category.");
            const e: Expense = {
              id: expense?.id || uid(),
              name: name.trim(),
              cents: cents(amount),
              date: due,
              kind,
              category: category.trim(),
              notes,
              reminder,
              paidDates: expense?.paidDates || [],
              paidAmounts: expense?.paidAmounts,
            };
            if (
              !expense &&
              !duplicateConfirmed &&
              data.expenses.some(
                (x) =>
                  x.name.toLowerCase() === e.name.toLowerCase() &&
                  x.date === e.date &&
                  x.cents === e.cents &&
                  x.kind === e.kind,
              )
            ) {
              setDuplicateConfirmed(true);
              setError(
                "A matching payment already exists. Save again only if you want both.",
              );
              return;
            }
            update((d) => ({
              ...d,
              expenses: expense
                ? d.expenses.map((x) => (x.id === e.id ? e : x))
                : [...d.expenses, e],
            }));
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
      {expense && (
        <Button
          secondary
          title={
            confirm
              ? "Confirm delete expense and its payment history"
              : "Delete expense"
          }
          onPress={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            update((d) => ({
              ...d,
              expenses: d.expenses.filter((e) => e.id !== expense.id),
            }));
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}
export function BalanceEditor({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const [balance, setBalance] = useState(String(data.balance / 100));
  const [date, setDate] = useState(data.balanceDate);
  const [error, setError] = useState("");
  return (
    <Sheet title="Your entered balance" visible onClose={onClose}>
      <Text style={s.muted}>
        A snapshot of cash you have already. Paid expenses before this snapshot
        are already reflected in it. This is separate from your spending budget
        and any bank account balance.
      </Text>
      <Field
        label="Balance (CAD)"
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
      />
      <Field
        label="Snapshot date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      {error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Update balance"
        onPress={() => {
          try {
            parseDate(date);
            if (date > iso(new Date()))
              throw new Error("A balance snapshot cannot be in the future.");
            const b = cents(balance);
            update((d) => ({ ...d, balance: b, balanceDate: date }));
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </Sheet>
  );
}
export function BudgetEditor({
  kind,
  onClose,
}: {
  kind: "once" | "monthly";
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const [amount, setAmount] = useState(String(data.budgets[kind] / 100));
  const [start, setStart] = useState(data.semesterStart);
  const [end, setEnd] = useState(data.semesterEnd);
  const [error, setError] = useState("");
  return (
    <Sheet
      title={kind === "once" ? "Semester budget" : "Monthly budget"}
      visible
      onClose={onClose}
    >
      <Field
        label="Budget (CAD)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      {kind === "once" && (
        <>
          <Field
            label="Semester starts (YYYY-MM-DD)"
            value={start}
            onChangeText={setStart}
          />
          <Field
            label="Semester ends (YYYY-MM-DD)"
            value={end}
            onChangeText={setEnd}
          />
        </>
      )}
      {error && <Text style={s.error}>{error}</Text>}
      <Button
        title="Save budget"
        onPress={() => {
          try {
            const b = cents(amount);
            parseDate(start);
            parseDate(end);
            if (start > end)
              throw new Error("Semester end must follow its start.");
            update((d) => ({
              ...d,
              budgets: { ...d.budgets, [kind]: b },
              semesterStart: start,
              semesterEnd: end,
            }));
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </Sheet>
  );
}
export function EntryEditor({
  onClose,
  entry: existing,
}: {
  onClose: () => void;
  entry?: Entry;
}) {
  const { data, update } = useStore();
  const [name, setName] = useState(existing?.name || "");
  const [amount, setAmount] = useState(
    existing ? String(existing.cents / 100) : "",
  );
  const [date, setDate] = useState(existing?.date || iso(new Date()));
  const [type, setType] = useState(existing?.type || "income");
  const [expenseId, setExpenseId] = useState(existing?.expenseId || "");
  const [error, setError] = useState("");
  return (
    <Sheet title="Income, savings or refund" visible onClose={onClose}>
      <Chips
        values={["income", "savings", "refund"]}
        value={type}
        onChange={(v) => setType(v as Entry["type"])}
      />
      {type === "refund" && (
        <>
          <Text style={s.label}>
            Related payment (optional; links refund to its budget)
          </Text>
          <Chips
            values={["Unlinked", ...data.expenses.map((e) => e.name)]}
            value={
              data.expenses.find((e) => e.id === expenseId)?.name || "Unlinked"
            }
            onChange={(name) =>
              setExpenseId(data.expenses.find((e) => e.name === name)?.id || "")
            }
          />
        </>
      )}
      <Field label="Description" value={name} onChangeText={setName} />
      <Field label="Amount (CAD)" value={amount} onChangeText={setAmount} />
      <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <Text style={s.muted}>
        Entries are kept separate from your entered balance. Future income
        affects projections; savings entries record transfers and do not create
        new cash.
      </Text>
      {error && <Text style={s.error}>{error}</Text>}
      <Button
        title={existing ? "Save entry" : "Add entry"}
        onPress={() => {
          try {
            parseDate(date);
            if (!name.trim()) throw new Error("Add a description.");
            const entry = {
              id: existing?.id || uid(),
              expenseId: type === "refund" ? expenseId : undefined,
              name: name.trim(),
              cents: cents(amount),
              date,
              type: type as "income" | "savings" | "refund",
            };
            update((d) => ({
              ...d,
              entries: existing
                ? d.entries.map((e) => (e.id === existing.id ? entry : e))
                : [...d.entries, entry],
            }));
            onClose();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </Sheet>
  );
}
