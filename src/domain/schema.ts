import { z } from "zod";
import { parseDate } from "./finance";
const amount = z.number().int().min(0).max(10000000000);
const date = z.string().refine((s) => {
  try {
    const d = parseDate(s);
    return d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  } catch {
    return false;
  }
}, "Use a real date between 2000 and 2100.");
const short = z.string().max(200);
const id = z.string().min(1).max(200);
export const stateSchema = z
  .object({
    profile: z.object({
      name: short,
      city: short,
      province: short,
      stage: short,
      university: short,
      program: short,
      employment: short,
      employer: short,
      role: short,
      annualIncome: amount,
      tuitionMin: amount,
      tuitionMax: amount,
      avatar: z.string().max(3000000).nullable(),
    }),
    balance: amount,
    balanceDate: date,
    budgets: z.object({ once: amount, monthly: amount }),
    semesterStart: date,
    semesterEnd: date,
    expenses: z
      .array(
        z.object({
          id,
          name: z.string().min(1).max(100),
          cents: amount,
          date,
          kind: z.enum(["once", "monthly", "weekly"]),
          category: z.string().min(1).max(60),
          notes: z.string().max(1000),
          paidDates: z.array(date).max(1000),
          paidAmounts: z.record(date, amount).optional(),
          reminder: z.boolean(),
        }),
      )
      .max(1000),
    entries: z
      .array(
        z.object({
          id,
          name: short,
          cents: amount,
          date,
          type: z.enum(["income", "savings", "refund"]),
          expenseId: z.string().optional(),
        }),
      )
      .max(2000),
    goals: z
      .array(z.object({ id, name: short, target: amount, saved: amount }))
      .max(100),
    saved: z.record(
      id,
      z.object({
        status: short,
        notes: z.string().max(4000),
        reminderDate: z.string().nullable(),
      }),
    ),
    transactions: z
      .array(
        z.object({
          externalId: id,
          date,
          name: short,
          cents: amount,
          category: short,
        }),
      )
      .max(10000),
    chats: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().max(10000),
        }),
      )
      .max(500),
    settings: z.object({
      notifications: z.boolean(),
      reminderDays: z.number().int().min(0).max(30),
      timezone: short,
      financialContext: z.boolean(),
    }),
    onboarded: z.boolean(),
  })
  .refine(
    (d) => d.semesterEnd >= d.semesterStart,
    "Semester end must follow start.",
  )
  .refine(
    (d) => d.profile.tuitionMax >= d.profile.tuitionMin,
    "Maximum tuition must cover minimum tuition.",
  );
