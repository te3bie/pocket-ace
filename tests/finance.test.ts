import { describe, it, expect } from "vitest";
import {
  cents,
  Expense,
  goalProgress,
  monthCells,
  occurrences,
  parseDate,
  projectedBalance,
  totals,
} from "../src/domain/finance";
const e = (over: Partial<Expense> = {}): Expense => ({
  id: "x",
  name: "Rent",
  cents: 10000,
  date: "2026-01-31",
  kind: "monthly",
  category: "Housing",
  notes: "",
  reminder: false,
  paidDates: [],
  ...over,
});
describe("CAD arithmetic", () => {
  it("parses decimal strings exactly", () => {
    expect(cents("0.29")).toBe(29);
    expect(cents("123.4")).toBe(12340);
    expect(cents("0")).toBe(0);
    for (const v of ["-1", "1.001", "NaN", "1e9", ""])
      expect(() => cents(v)).toThrow();
  });
  it("does not count paid payments twice and applies refunds", () => {
    const items = occurrences(
      [e({ kind: "once", paidDates: ["2026-01-31"] })],
      "2026-01-01",
      "2026-01-31",
    );
    expect(totals(items, 20000, 1000)).toEqual({
      planned: 10000,
      actual: 9000,
      remaining: 11000,
      outstanding: 0,
    });
    expect(projectedBalance(50000, items, 0)).toBe(50000);
  });
  it("handles zero income, overspending and goals", () => {
    const items = occurrences(
      [e({ kind: "once" })],
      "2026-01-01",
      "2026-01-31",
    );
    expect(projectedBalance(0, items, 0)).toBe(-10000);
    expect(totals(items, 0).remaining).toBe(-10000);
    expect(goalProgress({ id: "g", name: "x", target: 0, saved: 0 })).toBe(1);
    expect(goalProgress({ id: "g", name: "x", target: 100, saved: 200 })).toBe(
      1,
    );
  });
});
describe("recurrence and dates", () => {
  it("clamps monthly day without losing original anchor", () => {
    expect(
      occurrences([e()], "2026-01-01", "2026-04-30").map((o) => o.date),
    ).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });
  it("handles leap years and never occurs before start", () => {
    expect(
      occurrences([e({ date: "2028-01-30" })], "2027-12-01", "2028-03-31").map(
        (o) => o.date,
      ),
    ).toEqual(["2028-01-30", "2028-02-29", "2028-03-30"]);
  });
  it("handles weekly boundaries with inclusive dates", () => {
    expect(
      occurrences(
        [e({ date: "2026-10-25", kind: "weekly" })],
        "2026-11-01",
        "2026-11-15",
      ).map((o) => o.date),
    ).toEqual(["2026-11-01", "2026-11-08", "2026-11-15"]);
  });
  it("validates dates and aligns Sunday first", () => {
    expect(() => parseDate("2026-02-29")).toThrow();
    expect(() => parseDate("2026-13-01")).toThrow();
    expect(monthCells(new Date(2026, 10, 1))[0]).toBe("2026-11-01");
    expect(monthCells(new Date(2026, 11, 1)).slice(0, 2)).toEqual([null, null]);
  });
});
import { zonedReminder, reminderDate } from "../src/domain/time";
it("keeps 9am Toronto reminders across DST and date boundaries", () => {
  expect(zonedReminder("2026-03-07", "America/Toronto").toISOString()).toBe(
    "2026-03-07T14:00:00.000Z",
  );
  expect(zonedReminder("2026-03-09", "America/Toronto").toISOString()).toBe(
    "2026-03-09T13:00:00.000Z",
  );
  expect(reminderDate("2026-01-01", 1, "America/Toronto").toISOString()).toBe(
    "2025-12-31T14:00:00.000Z",
  );
  expect(() => zonedReminder("2026-01-01", "invalid")).toThrow();
});
import { cashProjection, refundsFor } from "../src/domain/finance";
it("subtracts paid payments after snapshot once, excluding snapshot-day history", () => {
  const items = occurrences(
    [
      e({ date: "2026-01-02", kind: "once", paidDates: ["2026-01-02"] }),
      e({
        id: "old",
        date: "2026-01-01",
        kind: "once",
        paidDates: ["2026-01-01"],
      }),
    ],
    "2026-01-01",
    "2026-01-31",
  );
  expect(
    cashProjection(50000, "2026-01-01", "2026-01-31", items, [
      {
        id: "r",
        name: "refund",
        cents: 1000,
        date: "2026-01-03",
        type: "refund",
      },
      {
        id: "s",
        name: "transfer",
        cents: 99999,
        date: "2026-01-03",
        type: "savings",
      },
    ]),
  ).toBe(41000);
});
it("preserves paid amounts when a recurring template price changes", () => {
  const items = occurrences(
    [
      e({
        cents: 20000,
        paidDates: ["2026-01-31"],
        paidAmounts: { "2026-01-31": 10000 },
      }),
    ],
    "2026-01-01",
    "2026-02-28",
  );
  expect(items.map((o) => o.expense.cents)).toEqual([10000, 20000]);
  expect(totals(items, 40000).actual).toBe(10000);
});
