import { it, expect } from "vitest";
import { parseCSV } from "../src/domain/csv";
import { demoCatalog, searchCatalog, Filters } from "../src/domain/catalog";
const f: Filters = {
  query: "",
  type: "",
  location: "",
  level: "",
  maxTuition: 10000000,
  minAward: 0,
  deadlineBefore: "",
  institution: "",
  program: "",
  eligibility: "",
};
it("parses quoted CSV and rejects duplicate ids and malformed dates", () => {
  expect(
    parseCSV(
      'id,date,name,amount,category\n1,2026-11-03,"Books, used",12.50,Education',
    )[0],
  ).toMatchObject({ name: "Books, used", cents: 1250 });
  expect(() =>
    parseCSV(
      "id,date,name,amount,category\n1,2026-11-03,A,1,X\n1,2026-11-03,B,2,Y",
    ),
  ).toThrow("Duplicate");
  expect(() =>
    parseCSV("id,date,name,amount,category\n1,2026-02-30,A,1,X"),
  ).toThrow();
});
it("filters by query, provider, tuition, award, stage and location", () => {
  expect(
    searchCatalog(demoCatalog, {
      ...f,
      query: "business",
      location: "Toronto",
      maxTuition: 900000,
    }),
  ).toHaveLength(1);
  expect(
    searchCatalog(demoCatalog, { ...f, type: "scholarship", minAward: 300000 }),
  ).toHaveLength(0);
  expect(
    searchCatalog(demoCatalog, {
      ...f,
      type: "extracurricular",
      level: "High school",
    }),
  ).toHaveLength(1);
});
it("all demo records are fictional and have no invented live application", () => {
  expect(
    demoCatalog.every(
      (o) =>
        o.demo &&
        o.url === null &&
        o.verifiedAt === null &&
        o.deadline === null,
    ),
  ).toBe(true);
});
import { opportunitySchema } from "../src/domain/catalog";
it("validates all demo catalog records and rejects malformed live records", () => {
  for (const row of demoCatalog)
    expect(opportunitySchema.safeParse(row).success).toBe(true);
  expect(
    opportunitySchema.safeParse({ ...demoCatalog[0], type: "unknown" }).success,
  ).toBe(false);
  expect(
    opportunitySchema.safeParse({
      ...demoCatalog[0],
      url: "javascript:alert(1)",
    }).success,
  ).toBe(false);
});
