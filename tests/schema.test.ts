import { it, expect } from "vitest";
import { stateSchema } from "../src/domain/schema";
it("rejects malformed and partial financial state rather than silently using it", () => {
  expect(stateSchema.safeParse({ balance: NaN }).success).toBe(false);
  expect(stateSchema.safeParse({ balance: -100 }).success).toBe(false);
  expect(
    stateSchema.safeParse({ profile: { annualIncome: 100.5 } }).success,
  ).toBe(false);
});
