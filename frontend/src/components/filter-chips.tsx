import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/src/theme";

export type Chip = { key: string; label: string };

type Props = {
  chips: Chip[];
  active: string;
  onChange: (key: string) => void;
  testIDPrefix?: string;
};

export function FilterChips({ chips, active, onChange, testIDPrefix = "chip" }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {chips.map((c) => {
        const isActive = c.key === active;
        return (
          <TouchableOpacity
            key={c.key}
            onPress={() => onChange(c.key)}
            activeOpacity={0.8}
            testID={`${testIDPrefix}-${c.key}`}
            style={[
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.onBrandPrimary : colors.onSurfaceSecondary },
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: "600" },
});
