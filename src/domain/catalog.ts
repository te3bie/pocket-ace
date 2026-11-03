export type Opportunity = {
  id: string;
  name: string;
  provider: string;
  type: "program" | "scholarship" | "bursary" | "extracurricular";
  summary: string;
  location: string;
  program: string;
  level: string;
  tuition: number | null;
  award: number | null;
  deadline: string | null;
  url: string | null;
  verifiedAt: string | null;
  academicYear: string;
  demo: boolean;
  sponsored: boolean;
  eligibility: string;
};
export const demoCatalog: Opportunity[] = [
  {
    id: "d1",
    name: "Business & Economics",
    provider: "Example Lakeside University",
    type: "program",
    summary:
      "Explore a four-year program combining business fundamentals and economic thinking.",
    location: "Toronto, Ontario",
    program: "Business",
    level: "Undergraduate",
    tuition: 800000,
    award: null,
    deadline: null,
    url: null,
    verifiedAt: null,
    academicYear: "Demo only",
    demo: true,
    sponsored: false,
    eligibility: "Fictional program. No real admissions requirements.",
  },
  {
    id: "d2",
    name: "Future Leaders Award",
    provider: "Example Student Foundation",
    type: "scholarship",
    summary: "An example award for students contributing to their community.",
    location: "Ontario",
    program: "Any",
    level: "Undergraduate",
    tuition: null,
    award: 250000,
    deadline: null,
    url: null,
    verifiedAt: null,
    academicYear: "Demo only",
    demo: true,
    sponsored: false,
    eligibility: "Fictional award. Eligibility and value are illustrative.",
  },
  {
    id: "d3",
    name: "Student Access Bursary",
    provider: "Example Learning Fund",
    type: "bursary",
    summary:
      "See how a needs-based funding opportunity could fit into your university plan.",
    location: "Ontario",
    program: "Any",
    level: "Undergraduate",
    tuition: null,
    award: 150000,
    deadline: null,
    url: null,
    verifiedAt: null,
    academicYear: "Demo only",
    demo: true,
    sponsored: false,
    eligibility: "Fictional bursary. Do not submit personal information.",
  },
  {
    id: "d4",
    name: "Community Design Lab",
    provider: "Example Youth Collective",
    type: "extracurricular",
    summary:
      "An example weekend project to build teamwork and practical skills.",
    location: "Mississauga, Ontario",
    program: "Design",
    level: "High school",
    tuition: 0,
    award: null,
    deadline: null,
    url: null,
    verifiedAt: null,
    academicYear: "Demo only",
    demo: true,
    sponsored: false,
    eligibility: "Fictional activity. No real registration available.",
  },
];
export type Filters = {
  query: string;
  type: string;
  location: string;
  level: string;
  maxTuition: number;
  minAward: number;
  deadlineBefore: string;
  institution: string;
  program: string;
  eligibility: string;
};
export function searchCatalog(rows: Opportunity[], f: Filters) {
  return rows.filter((o) => {
    const text = [o.name, o.provider, o.summary, o.program, o.location]
      .join(" ")
      .toLowerCase();
    return (
      (!f.query || text.includes(f.query.toLowerCase())) &&
      (!f.type || o.type === f.type) &&
      (!f.location ||
        o.location.toLowerCase().includes(f.location.toLowerCase())) &&
      (!f.level || o.level === f.level) &&
      (!f.institution ||
        o.provider.toLowerCase().includes(f.institution.toLowerCase())) &&
      (!f.program ||
        o.program.toLowerCase().includes(f.program.toLowerCase())) &&
      (!f.eligibility ||
        o.eligibility.toLowerCase().includes(f.eligibility.toLowerCase())) &&
      (o.tuition === null || o.tuition <= f.maxTuition) &&
      (o.award === null || o.award >= f.minAward) &&
      (!f.deadlineBefore || (!!o.deadline && o.deadline <= f.deadlineBefore))
    );
  });
}

import { z } from "zod";
const verifiedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const opportunitySchema = z.object({
  id: z.string().min(1).max(150),
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(200),
  type: z.enum(["program", "scholarship", "bursary", "extracurricular"]),
  summary: z.string().max(2000),
  location: z.string().max(200),
  program: z.string().max(200),
  level: z.string().max(100),
  tuition: z.number().int().nonnegative().max(10000000000).nullable(),
  award: z.number().int().nonnegative().max(10000000000).nullable(),
  deadline: verifiedDate.nullable(),
  url: z.string().url().startsWith("https://").nullable(),
  verifiedAt: verifiedDate.nullable(),
  academicYear: z.string().max(100),
  demo: z.boolean(),
  sponsored: z.boolean().default(false),
  eligibility: z.string().max(2000),
});
