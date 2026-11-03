import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { stateSchema } from "../domain/schema";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { configured, supabase } from "./supabase";
import { Entry, Expense, Goal, iso } from "../domain/finance";
export type Profile = {
  name: string;
  city: string;
  province: string;
  stage: string;
  university: string;
  program: string;
  employment: string;
  employer: string;
  role: string;
  annualIncome: number;
  tuitionMin: number;
  tuitionMax: number;
  avatar: string | null;
};
export type AppData = {
  profile: Profile;
  balance: number;
  balanceDate: string;
  budgets: { once: number; monthly: number };
  semesterStart: string;
  semesterEnd: string;
  expenses: Expense[];
  entries: Entry[];
  goals: Goal[];
  saved: Record<
    string,
    { status: string; notes: string; reminderDate: string | null }
  >;
  transactions: {
    externalId: string;
    date: string;
    name: string;
    cents: number;
    category: string;
  }[];
  chats: { role: "user" | "assistant"; content: string }[];
  settings: {
    notifications: boolean;
    reminderDays: number;
    timezone: string;
    financialContext: boolean;
  };
  onboarded: boolean;
};
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export function initial(demo = false): AppData {
  const now = new Date(),
    day = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return iso(d);
    };
  return {
    profile: {
      name: demo ? "Alex Morgan" : "",
      city: demo ? "Mississauga" : "",
      province: "Ontario",
      stage: "High school",
      university: demo ? "Your future university" : "",
      program: demo ? "Business" : "",
      employment: "Not employed",
      employer: "",
      role: "",
      annualIncome: 0,
      tuitionMin: 0,
      tuitionMax: 1000000,
      avatar: null,
    },
    balance: demo ? 1300000 : 0,
    balanceDate: iso(now),
    budgets: { once: demo ? 800000 : 0, monthly: demo ? 200000 : 0 },
    semesterStart: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    semesterEnd: iso(new Date(now.getFullYear(), now.getMonth() + 4, 0)),
    expenses: demo
      ? [
          {
            id: "tuition",
            name: "Tuition",
            cents: 550000,
            date: day(11),
            kind: "once",
            category: "Education",
            notes: "Fictional semester estimate",
            paidDates: [],
            reminder: false,
          },
          {
            id: "books",
            name: "Textbooks",
            cents: 50000,
            date: day(5),
            kind: "once",
            category: "Education",
            notes: "Fictional estimate",
            paidDates: [],
            reminder: false,
          },
          {
            id: "laptop",
            name: "Laptop",
            cents: 130000,
            date: day(18),
            kind: "once",
            category: "Technology",
            notes: "Fictional estimate",
            paidDates: [],
            reminder: false,
          },
          {
            id: "rent",
            name: "House rent",
            cents: 85000,
            date: day(4),
            kind: "monthly",
            category: "Housing",
            notes: "Fictional estimate",
            paidDates: [],
            reminder: false,
          },
          {
            id: "food",
            name: "Groceries",
            cents: 30000,
            date: day(2),
            kind: "monthly",
            category: "Food",
            notes: "Fictional estimate",
            paidDates: [],
            reminder: false,
          },
          {
            id: "bus",
            name: "Transit pass",
            cents: 12000,
            date: day(6),
            kind: "monthly",
            category: "Transport",
            notes: "Fictional estimate",
            paidDates: [],
            reminder: false,
          },
        ]
      : [],
    entries: [],
    goals: demo
      ? [
          {
            id: "university",
            name: "University fund",
            target: 2000000,
            saved: 650000,
          },
          {
            id: "emergency",
            name: "Emergency cushion",
            target: 100000,
            saved: 35000,
          },
        ]
      : [],
    saved: {},
    transactions: [],
    chats: [],
    settings: {
      notifications: false,
      reminderDays: 1,
      timezone: "America/Toronto",
      financialContext: false,
    },
    onboarded: demo,
  };
}
type Store = {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  session: Session | null;
  demo: boolean;
  ready: boolean;
  error: string;
  syncing: boolean;
  startDemo: () => Promise<void>;
  exit: () => Promise<void>;
  retry: () => void;
};
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initial());
  const [session, setSession] = useState<Session | null>(null);
  const [demo, setDemo] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [revision, setRevision] = useState(0);
  const hydrated = useRef(false);
  const loadedUser = useRef("");
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("pocketace-demo-mode")
      .then(async (v) => {
        if (!active) return;
        if (v === "true") {
          const raw = await AsyncStorage.getItem("pocketace-demo");
          if (!active) return;
          setData(raw ? stateSchema.parse(JSON.parse(raw)) : initial(true));
          setDemo(true);
          hydrated.current = true;
        }
        if (configured) {
          const { data } = await supabase.auth.getSession();
          if (active) setSession(data.session);
        }
        if (active) setReady(true);
      })
      .catch((e) => {
        setError(e.message);
        setReady(true);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      if (active) {
        if (s && s.user.id !== loadedUser.current && !demo) setReady(false);
        setSession(s);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session || demo) return;
    if (hydrated.current && loadedUser.current === session.user.id) return;
    let active = true;
    hydrated.current = false;
    setReady(false);
    loadedUser.current = session.user.id;
    (async () => {
      try {
        const { data: assurance, error: ae } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (ae) throw ae;
        if (
          assurance?.nextLevel === "aal2" &&
          assurance.currentLevel !== "aal2"
        ) {
          if (active) setReady(true);
          return;
        }
        const { data: row, error: e } = await supabase
          .from("app_states")
          .select("data")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!active) return;
        if (e) throw e;
        const validated = row?.data ? stateSchema.parse(row.data) : initial();
        setData(validated);
        hydrated.current = true;
        setReady(true);
      } catch (e) {
        if (active) {
          setError(`Could not load account: ${(e as Error).message}`);
          setReady(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.user.id, session?.access_token, demo, revision]);
  useEffect(() => {
    if (!ready || !hydrated.current || (!demo && !session)) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSyncing(true);
      try {
        if (demo)
          await AsyncStorage.setItem("pocketace-demo", JSON.stringify(data));
        else {
          const { error: e } = await supabase
            .from("app_states")
            .upsert({ user_id: session!.user.id, data });
          if (e) throw e;
        }
        if (active) setError("");
      } catch (e) {
        if (active)
          setError(
            `Changes are not saved: ${(e as Error).message}. Keep this screen open and retry.`,
          );
      } finally {
        if (active) setSyncing(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [data, demo, ready, session?.user.id, revision]);
  const startDemo = async () => {
    const raw = await AsyncStorage.getItem("pocketace-demo");
    setData(raw ? stateSchema.parse(JSON.parse(raw)) : initial(true));
    hydrated.current = true;
    setDemo(true);
    await AsyncStorage.setItem("pocketace-demo-mode", "true");
  };
  const exit = async () => {
    const reminders = await import("./notifications");
    await reminders.reschedule({
      ...data,
      settings: { ...data.settings, notifications: false },
    });
    if (!demo) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    await AsyncStorage.removeItem("pocketace-demo-mode");
    hydrated.current = false;
    setDemo(false);
    setSession(null);
    setData(initial());
    setError("");
  };
  return (
    <Context.Provider
      value={{
        data,
        update: (fn) =>
          setData((d) => {
            const next = fn(d);
            const result = stateSchema.safeParse(next);
            if (!result.success) {
              setError(result.error.issues[0].message);
              return d;
            }
            return result.data;
          }),
        session,
        demo,
        ready,
        error,
        syncing,
        startDemo,
        exit,
        retry: () => setRevision((v) => v + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
