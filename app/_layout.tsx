import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Stack, router, usePathname } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { StoreProvider, useStore } from "../src/lib/store";
import { Button, Field, Logo, Robot, colors, s } from "../src/components/ui";
import Auth from "../src/screens/Auth";
import { reschedule } from "../src/lib/notifications";
import { supabase } from "../src/lib/supabase";
const nav = [
  { path: "/", label: "Home", icon: "⌂" },
  { path: "/calendar", label: "Calendar", icon: "▦" },
  { path: "/discover", label: "Discover", icon: "⌕" },
  { path: "/profile", label: "Profile", icon: "◎" },
];
function Shell() {
  const { data, ready, demo, session, error, syncing, retry } = useStore();
  const { width } = useWindowDimensions();
  const path = usePathname();
  const [notificationError, setNotificationError] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [factor, setFactor] = useState("");
  const [code, setCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [recover, setRecover] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY") setRecover(true);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || demo) {
      setNeedsMfa(false);
      return;
    }
    supabase.auth.mfa
      .getAuthenticatorAssuranceLevel()
      .then(async ({ data }) => {
        setNeedsMfa(data?.nextLevel === "aal2" && data.currentLevel !== "aal2");
        const { data: f } = await supabase.auth.mfa.listFactors();
        setFactor(f?.totp[0]?.id || "");
      });
  }, [session?.access_token, demo]);
  useEffect(() => {
    if (!ready || (!demo && !session)) return;
    const timer = setTimeout(
      () =>
        reschedule(data)
          .then(() => setNotificationError(""))
          .catch((e) => setNotificationError(e.message)),
      800,
    );
    return () => clearTimeout(timer);
  }, [data.expenses, data.saved, data.settings, ready]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (url === "/calendar" || url === "/discover")
        router.push({
          pathname: url,
          params: r.notification.request.content.data as any,
        });
    });
    return () => sub.remove();
  }, []);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        <Logo />
        <Text style={[s.muted, { marginTop: 20 }]}>Opening your plan…</Text>
      </View>
    );
  if (!demo && !session) return <Auth />;
  if (recover || needsMfa)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          padding: 32,
          justifyContent: "center",
          backgroundColor: "white",
          gap: 18,
        }}
      >
        <Logo />
        <Text style={s.h2}>
          {recover ? "Choose a new password" : "Verify your authenticator"}
        </Text>
        <Field
          label={recover ? "New password (12+ characters)" : "Six-digit code"}
          value={recover ? newPassword : code}
          onChangeText={recover ? setNewPassword : setCode}
          secureTextEntry={recover}
        />
        {mfaError && <Text style={s.error}>{mfaError}</Text>}
        <Button
          title={recover ? "Update password" : "Verify"}
          onPress={async () => {
            if (recover) {
              if (newPassword.length < 12) {
                setMfaError("Use at least 12 characters.");
                return;
              }
              const { error } = await supabase.auth.updateUser({
                password: newPassword,
              });
              if (error) setMfaError(error.message);
              else setRecover(false);
            } else {
              const { error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: factor,
                code,
              });
              if (error) setMfaError(error.message);
              else setNeedsMfa(false);
            }
          }}
        />
      </SafeAreaView>
    );
  const wide = width >= 1000;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.wash }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          maxWidth: 1440,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {wide && (
          <View
            style={{
              width: 238,
              backgroundColor: "white",
              borderRightWidth: 1,
              borderColor: colors.line,
              padding: 28,
              gap: 35,
            }}
          >
            <Logo />
            <View style={{ gap: 10 }}>
              {nav.map((n) => (
                <Pressable
                  key={n.path}
                  accessibilityRole="link"
                  accessibilityLabel={n.label}
                  onPress={() => router.push(n.path as any)}
                  style={{
                    padding: 15,
                    borderRadius: 13,
                    backgroundColor: path === n.path ? "#EDF3FF" : "white",
                    flexDirection: "row",
                    gap: 13,
                  }}
                >
                  <Text style={{ fontSize: 21, color: colors.blue }}>
                    {n.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: path === n.path ? colors.royal : colors.muted,
                    }}
                  >
                    {n.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <View
              style={[s.card, { backgroundColor: colors.wash, padding: 15 }]}
            >
              <Text style={s.h3}>A plan for your future.</Text>
              <Text style={s.muted}>
                One student. One step. A world of possibilities.
              </Text>
            </View>
            <Text style={s.muted}>CAD · Made for students</Text>
          </View>
        )}
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <View
            style={{
              paddingHorizontal: wide ? 36 : 22,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderColor: colors.line,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {wide ? (
              <Text style={s.muted}>
                Welcome back,{" "}
                <Text style={{ fontWeight: "700", color: colors.ink }}>
                  {data.profile.name?.split(" ")[0] || "future planner"}
                </Text>
              </Text>
            ) : (
              <Logo small />
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/settings")}
              style={{ minHeight: 36, justifyContent: "center" }}
            >
              <Text style={s.muted}>
                {width < 350
                  ? ""
                  : syncing
                    ? "Saving…"
                    : demo
                      ? "Demo workspace"
                      : "Your workspace"}{" "}
                ⚙
              </Text>
            </Pressable>
          </View>
          {demo && (
            <View
              style={{
                backgroundColor: "#F0F6FF",
                paddingVertical: 7,
                paddingHorizontal: 24,
              }}
            >
              <Text
                style={{ fontSize: 11, color: "#416393", textAlign: "center" }}
              >
                FICTIONAL DEMO · Saved on this device · No live bank, AI or
                applications
              </Text>
            </View>
          )}
          {error && (
            <View style={{ padding: 10 }}>
              <Text style={s.error}>{error}</Text>
              <Button
                secondary
                title="Retry saving / loading"
                onPress={retry}
              />
            </View>
          )}
          {notificationError && (
            <Text style={s.error}>
              Reminder scheduling: {notificationError}
            </Text>
          )}
          {!data.onboarded && (
            <Pressable
              onPress={() => router.push("/profile")}
              style={{ padding: 12, backgroundColor: "#E7F6FF" }}
            >
              <Text style={{ fontSize: 13, color: colors.royal }}>
                Start with your profile → no income, job or university choice
                required.
              </Text>
            </Pressable>
          )}
          <ScrollView
            key={path}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              width: "100%",
              maxWidth: wide ? 760 : 680,
              alignSelf: "center",
              flexGrow: 1,
            }}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "none",
                contentStyle: { backgroundColor: "white" },
              }}
            />
          </ScrollView>
          {!wide && (
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderColor: colors.line,
                backgroundColor: "white",
                paddingVertical: 8,
              }}
            >
              {nav.map((n) => (
                <Pressable
                  key={n.path}
                  accessibilityRole="link"
                  accessibilityLabel={n.label}
                  onPress={() => router.push(n.path as any)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    minHeight: 48,
                    gap: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      color: path === n.path ? colors.royal : colors.muted,
                    }}
                  >
                    {n.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: path === n.path ? colors.royal : colors.muted,
                    }}
                  >
                    {n.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {path !== "/chat" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Talk to PocketPal"
              onPress={() => router.push("/chat")}
              style={{
                position: "absolute",
                right: wide ? 30 : 20,
                bottom: wide ? 24 : 82,
                backgroundColor: colors.cyan,
                borderRadius: 40,
                padding: 12,
                boxShadow: "0 4px 16px #1358A740",
                flexDirection: "row",
                gap: 9,
                alignItems: "center",
              }}
            >
              <Robot size={32} />
              {wide && (
                <Text
                  style={{ fontSize: 13, color: "white", fontWeight: "700" }}
                >
                  Ask PocketPal
                </Text>
              )}
            </Pressable>
          )}
        </View>
        {wide && width > 1250 && (
          <View style={{ width: 255, padding: 24, gap: 20 }}>
            <Text style={s.eyebrow}>YOUR NEXT CHAPTER</Text>
            <View style={s.card}>
              <Text style={{ fontSize: 30, color: colors.blue }}>✦</Text>
              <Text style={s.h2}>Start small.{"\n"}Dream big.</Text>
              <Text style={s.muted}>
                You don’t need everything figured out. Give your next goal a
                little space in your budget.
              </Text>
            </View>
            <Text style={s.muted}>
              Your entered balance and your budget are different. One is what
              you have; the other is your plan.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
