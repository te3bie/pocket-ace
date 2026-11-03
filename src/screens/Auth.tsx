import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import * as Linking from "expo-linking";
import { Button, Chips, Field, Logo, colors, s } from "../components/ui";
import { configured, supabase } from "../lib/supabase";
import { useStore } from "../lib/store";
export default function Auth() {
  const { startDemo } = useStore();
  const [mode, setMode] = useState("Welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      const u = new URL(url);
      const hash = new URLSearchParams(u.hash.slice(1));
      const access = hash.get("access_token"),
        refresh = hash.get("refresh_token");
      if (access && refresh) {
        const { error } = await supabase.auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });
        if (error) setMessage(error.message);
        if (hash.get("type") === "recovery") {
          setRecovery(true);
          setMode("Recovery");
        }
      }
      const code = u.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setMessage(error.message);
      }
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => sub.remove();
  }, []);
  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (!configured)
        throw new Error(
          "Live accounts require Supabase configuration. You can explore demo mode now.",
        );
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && mode !== "Recovery")
        throw new Error("Enter a valid email address.");
      const redirect = Linking.createURL("/");
      if (mode === "Sign up") {
        if (password.length < 12)
          throw new Error("Use at least 12 characters for your password.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect },
        });
        if (error) throw error;
        setMessage("Check your email to verify your account, then sign in.");
      } else if (mode === "Reset password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirect,
        });
        if (error) throw error;
        setMessage(
          "If an account exists, a recovery email will arrive shortly.",
        );
      } else if (mode === "Recovery") {
        if (password.length < 12)
          throw new Error("Use at least 12 characters.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecovery(false);
        setMessage("Password updated.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: colors.wash,
        justifyContent: "center",
        padding: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{ maxWidth: 440, width: "100%", alignSelf: "center", gap: 25 }}
      >
        <Logo />
        <View
          style={{
            height: 160,
            backgroundColor: "#E2EDFF",
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 66 }}>✦</Text>
          <Text style={[s.eyebrow, { color: colors.royal }]}>
            BIG DREAMS. A PLAN TO GET THERE.
          </Text>
        </View>
        <Text
          style={{
            fontSize: 38,
            fontWeight: "800",
            letterSpacing: -1,
            color: colors.ink,
          }}
        >
          Your next chapter,{"\n"}within reach.
        </Text>
        <Text style={s.body}>
          Plan university costs, build your budget and discover opportunities.
          Made for students, free to use.
        </Text>
        {mode === "Welcome" ? (
          <>
            <Button title="Get started" onPress={() => setMode("Sign up")} />
            <Button
              secondary
              title="I already have an account"
              onPress={() => setMode("Sign in")}
            />
            <Button
              secondary
              title="Explore the fictional demo"
              onPress={() => startDemo().catch((e) => setMessage(e.message))}
            />
          </>
        ) : (
          <View style={s.card}>
            <Text style={s.h2}>{mode}</Text>
            {mode !== "Recovery" && (
              <Field
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            )}{" "}
            {mode !== "Reset password" && (
              <Field
                label={
                  mode === "Sign up" ? "Password (12+ characters)" : "Password"
                }
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            )}
            <Button
              title={busy ? "Please wait…" : mode}
              disabled={busy}
              onPress={submit}
            />
            {mode === "Sign up" && (
              <Button
                secondary
                title="Resend verification email"
                onPress={async () => {
                  if (!configured) {
                    setMessage("Connect Supabase to send email.");
                    return;
                  }
                  const { error } = await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: { emailRedirectTo: Linking.createURL("/") },
                  });
                  setMessage(
                    error
                      ? error.message
                      : "If verification is pending, check your inbox.",
                  );
                }}
              />
            )}
            <Button
              secondary
              title="Forgot password"
              onPress={() => setMode("Reset password")}
            />
            <Button
              secondary
              title="Back to welcome"
              onPress={() => setMode("Welcome")}
            />
          </View>
        )}
        {message && (
          <Text accessibilityLiveRegion="polite" style={s.error}>
            {message}
          </Text>
        )}
        <Text style={s.muted}>
          We ask for only what your plan needs. No bank connection or employment
          required. Demo data stays on this device.
        </Text>
      </View>
    </ScrollView>
  );
}
