import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, XCircle, Info } from "lucide-react-native";

import { colors, radius, spacing } from "@/src/theme";

type ToastKind = "success" | "error" | "info";

type ToastState = {
  message: string;
  kind: ToastKind;
};

let setToastExt: ((t: ToastState | null) => void) | null = null;

export function toast(message: string, kind: ToastKind = "info") {
  setToastExt?.({ message, kind });
  setTimeout(() => setToastExt?.(null), 2500);
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [state, setState] = React.useState<ToastState | null>(null);
  React.useEffect(() => {
    setToastExt = setState;
    return () => {
      setToastExt = null;
    };
  }, []);
  if (!state) return null;
  const bg =
    state.kind === "success"
      ? colors.success
      : state.kind === "error"
      ? colors.error
      : colors.surfaceInverse;
  const Icon =
    state.kind === "success" ? CheckCircle2 : state.kind === "error" ? XCircle : Info;
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + 12,
        },
      ]}
      testID="toast-host"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setState(null)}
        style={[styles.toast, { backgroundColor: bg }]}
        testID={`toast-${state.kind}`}
      >
        <Icon color={colors.onBrand} size={20} />
        <Text style={styles.text}>{state.message}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    maxWidth: "92%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  text: { color: colors.onBrand, fontSize: 14, fontWeight: "600", flexShrink: 1 },
});
