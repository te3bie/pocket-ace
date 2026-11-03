import React from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
export const colors = {
  blue: "#4669F3",
  royal: "#1257EF",
  cyan: "#30B1F6",
  pale: "#99C8F5",
  ink: "#141B2B",
  muted: "#68748A",
  line: "#E6ECF5",
  wash: "#F5F8FE",
  white: "#FFFFFF",
  red: "#B93445",
};
export const s = StyleSheet.create({
  page: { padding: 24, paddingBottom: 110, gap: 24 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.7,
  },
  h2: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
  body: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 20, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: colors.blue,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 13,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#D9E2F1",
    backgroundColor: "#FFF",
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.wash,
    minHeight: 40,
  },
  link: { fontSize: 13, color: colors.royal, fontWeight: "700" },
  error: {
    padding: 13,
    borderRadius: 10,
    backgroundColor: "#FFF0F1",
    color: colors.red,
    fontSize: 14,
  },
  divider: { height: 1, backgroundColor: colors.line },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
    fontWeight: "700",
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    gap: 18,
    marginVertical: 40,
  },
  overlay: { flex: 1, backgroundColor: "#111C3D88" },
  badge: {
    fontSize: 11,
    color: colors.royal,
    backgroundColor: "#EDF3FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
});
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        secondary && {
          backgroundColor: colors.wash,
          borderWidth: 1,
          borderColor: colors.line,
        },
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: colors.royal }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Link({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Text style={s.link}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  ...rest
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8A96AB"
        style={s.input}
        {...rest}
      />
    </View>
  );
}
export function Chips({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <View style={[s.row, { flexWrap: "wrap", gap: 8 }]}>
      {values.map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected: value === v }}
          onPress={() => onChange(v)}
          style={[s.chip, value === v && { backgroundColor: colors.blue }]}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: value === v ? "white" : colors.muted,
            }}
          >
            {v}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Sheet({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.overlay}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View style={s.modal}>
            <View style={s.between}>
              <Text style={s.h2}>{title}</Text>
              <Link title="Close ×" onPress={onClose} />
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Logo({
  small = false,
  markOnly = false,
}: {
  small?: boolean;
  markOnly?: boolean;
}) {
  return (
    <View style={[s.row, { gap: 8 }]}>
      <Svg width={small ? 25 : 33} height={small ? 30 : 40} viewBox="0 0 40 48">
        <Path
          d="M3 37L20 4 37 37M9 26H31"
          stroke={colors.cyan}
          strokeWidth="4"
          fill="none"
        />
        <Path
          d="M5 13L20 44 35 13M11 25H29"
          stroke={colors.ink}
          strokeWidth="4"
          fill="none"
        />
      </Svg>
      {!markOnly && (
        <View>
          <Text
            style={{
              color: colors.ink,
              fontSize: small ? 13 : 18,
              fontWeight: "900",
              letterSpacing: 0.5,
            }}
          >
            POCKET<Text style={{ color: colors.blue }}> ACE</Text>
          </Text>
          {!small && (
            <Text
              style={{ fontSize: 9, letterSpacing: 2, color: colors.muted }}
            >
              YOUR FUTURE, IN FOCUS
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
export function Robot({ size = 38 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M48 20L42 12Q38 5 45 6L50 10 55 6Q63 5 58 12L52 20"
        fill="white"
      />
      <Path
        d="M19 39Q22 21 50 21Q78 21 81 39L90 44V66L80 72 75 91H25L20 72 10 66V44Z"
        fill="white"
      />
      <Path
        d="M28 44Q28 38 35 38H43L50 46 57 38H66Q73 38 73 46V59Q73 70 50 70Q28 70 28 59Z"
        fill={colors.cyan}
      />
      <Circle cx="39" cy="53" r="5" fill="white" />
      <Circle cx="63" cy="53" r="5" fill="white" />
      <Path d="M43 62Q50 68 57 62" stroke="white" strokeWidth="2" fill="none" />
      <Path d="M42 79Q42 73 50 79Q59 73 58 80L50 88Z" fill={colors.cyan} />
    </Svg>
  );
}
export function Pie({
  values,
  size = 138,
}: {
  values: number[];
  size?: number;
}) {
  const total = values.reduce((a, b) => a + b, 0);
  let angle = -Math.PI / 2;
  const palette = [colors.blue, colors.pale, colors.cyan, "#BBD6FF", "#2241A5"];
  return (
    <Svg
      accessibilityLabel="Expense breakdown pie chart"
      width={size}
      height={size}
      viewBox="0 0 120 120"
    >
      {total === 0 ? (
        <Circle cx="60" cy="60" r="54" fill={colors.line} />
      ) : (
        values.map((v, i) => {
          if (!v) return null;
          const a = angle;
          angle += (v / total) * Math.PI * 2;
          if (v === total)
            return (
              <Circle key={i} cx="60" cy="60" r="54" fill={palette[i % 5]} />
            );
          return (
            <Path
              key={i}
              d={`M60 60L${60 + 54 * Math.cos(a)} ${60 + 54 * Math.sin(a)}A54 54 0 ${v / total > 0.5 ? 1 : 0} 1 ${60 + 54 * Math.cos(angle)} ${60 + 54 * Math.sin(angle)}Z`}
              fill={palette[i % 5]}
            />
          );
        })
      )}
    </Svg>
  );
}
export function LineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View
      accessibilityLabel={`Projected monthly spending: ${values.map((v) => (v / 100).toFixed(2)).join(", ")} CAD`}
    >
      <Svg height="160" width="100%" viewBox="0 0 320 160">
        {[20, 60, 100, 140].map((y) => (
          <Line key={y} x1="5" y1={y} x2="315" y2={y} stroke={colors.line} />
        ))}
        <Polyline
          points={values
            .map(
              (v, i) =>
                `${10 + i * (300 / Math.max(values.length - 1, 1))},${140 - (v / max) * 115}`,
            )
            .join(" ")}
          fill="none"
          stroke={colors.blue}
          strokeWidth="3"
        />
        {values.map((v, i) => (
          <Circle
            key={i}
            cx={10 + i * (300 / Math.max(values.length - 1, 1))}
            cy={140 - (v / max) * 115}
            r="4"
            fill={colors.cyan}
          />
        ))}
      </Svg>
    </View>
  );
}
