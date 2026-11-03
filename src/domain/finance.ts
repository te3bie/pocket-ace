export type Expense = {
  id: string;
  name: string;
  cents: number;
  date: string;
  kind: "once" | "monthly" | "weekly";
  category: string;
  notes: string;
  paidDates: string[];
  paidAmounts?: Record<string, number>;
  reminder: boolean;
};
export type Entry = {
  id: string;
  name: string;
  cents: number;
  date: string;
  type: "income" | "savings" | "refund";
  expenseId?: string;
};
export type Goal = { id: string; name: string; target: number; saved: number };
export const money = (cents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100,
  );
export function cents(input: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(input.trim()))
    throw new Error(
      "Enter a non-negative amount with up to two decimal places.",
    );
  const [a, b = ""] = input.trim().split(".");
  const result = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > 10000000000)
    throw new Error("Amount is too large.");
  return result;
}
export function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error("Use YYYY-MM-DD.");
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  if (iso(d) !== s) throw new Error("Enter a real date.");
  return d;
}
export type Occurrence = {
  expense: Expense;
  date: string;
  paid: boolean;
  key: string;
};
export function occurrences(
  expenses: Expense[],
  start: string,
  end: string,
): Occurrence[] {
  const from = parseDate(start),
    to = parseDate(end);
  if (to < from) throw new Error("End date precedes start.");
  const result: Occurrence[] = [];
  for (const e of expenses) {
    const base = parseDate(e.date);
    const add = (d: Date) => {
      const date = iso(d);
      if (d >= from && d <= to && d >= base)
        result.push({
          expense:
            e.paidDates.includes(date) && e.paidAmounts?.[date] !== undefined
              ? { ...e, cents: e.paidAmounts[date] }
              : e,
          date,
          paid: e.paidDates.includes(date),
          key: `${e.id}:${date}`,
        });
    };
    if (e.kind === "once") add(base);
    else if (e.kind === "monthly") {
      for (
        let y = from.getFullYear(), m = from.getMonth();
        new Date(y, m, 1, 12) <= to;
        m++
      ) {
        const first = new Date(y, m, 1, 12);
        const last = new Date(
          first.getFullYear(),
          first.getMonth() + 1,
          0,
          12,
        ).getDate();
        add(
          new Date(
            first.getFullYear(),
            first.getMonth(),
            Math.min(base.getDate(), last),
            12,
          ),
        );
      }
    } else {
      const skip = Math.max(
        0,
        Math.floor((from.getTime() - base.getTime()) / 86400000 / 7) - 1,
      );
      const d = new Date(base);
      d.setDate(d.getDate() + skip * 7);
      for (; d <= to; d.setDate(d.getDate() + 7)) add(new Date(d));
    }
  }
  return result.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.expense.name.localeCompare(b.expense.name),
  );
}
export function totals(items: Occurrence[], budget: number, refunds = 0) {
  const planned = items.reduce((s, o) => s + o.expense.cents, 0);
  const actual =
    items.filter((o) => o.paid).reduce((s, o) => s + o.expense.cents, 0) -
    refunds;
  return {
    planned,
    actual,
    remaining: budget - planned + refunds,
    outstanding: items
      .filter((o) => !o.paid)
      .reduce((s, o) => s + o.expense.cents, 0),
  };
}
export function projectedBalance(
  snapshot: number,
  items: Occurrence[],
  futureIncome: number,
) {
  return (
    snapshot +
    futureIncome -
    items.filter((o) => !o.paid).reduce((s, o) => s + o.expense.cents, 0)
  );
}
export const goalProgress = (g: Goal) =>
  g.target === 0 ? 1 : Math.min(1, Math.max(0, g.saved / g.target));
export function monthBounds(date: Date) {
  return [
    iso(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
    iso(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
  ] as const;
}
export function monthCells(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12),
    days = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12).getDate();
  return [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: days }, (_, i) =>
      iso(new Date(date.getFullYear(), date.getMonth(), i + 1, 12)),
    ),
  ];
}
// Snapshot means end-of-day cash on balanceDate; later paid expenses are deducted exactly once.
export function cashProjection(
  snapshot: number,
  snapshotDate: string,
  end: string,
  items: Occurrence[],
  entries: Entry[],
) {
  const later = items.filter((o) => o.date > snapshotDate && o.date <= end);
  const inflow = entries
    .filter(
      (e) => e.type !== "savings" && e.date > snapshotDate && e.date <= end,
    )
    .reduce((a, e) => a + e.cents, 0);
  return snapshot + inflow - later.reduce((a, o) => a + o.expense.cents, 0);
}
export function refundsFor(
  entries: Entry[],
  expenses: Expense[],
  start: string,
  end: string,
) {
  const ids = new Set(expenses.map((e) => e.id));
  return entries
    .filter(
      (e) =>
        e.type === "refund" &&
        !!e.expenseId &&
        ids.has(e.expenseId) &&
        e.date >= start &&
        e.date <= end,
    )
    .reduce((s, e) => s + e.cents, 0);
}
