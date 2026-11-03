import "react-native-url-polyfill/auto";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
export const configured = !!(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://unconfigured.supabase.co",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "unconfigured",
  {
    auth: {
      storage:
        Platform.OS === "web" && typeof window === "undefined"
          ? undefined
          : AsyncStorage,
      autoRefreshToken: true,
      persistSession: Platform.OS !== "web" || typeof window !== "undefined",
      detectSessionInUrl: false,
    },
  },
);
export async function invoke(name: string, body: Record<string, unknown>) {
  if (!configured)
    throw new Error("Connect a Supabase project to use this service.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

if (Platform.OS !== "web")
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
