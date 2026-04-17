import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { AppColors, AppRadius } from "@/constants/design";

type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
};

export function AppCard({ children, style, muted = false }: AppCardProps) {
  return <View style={[styles.card, muted && styles.mutedCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadius.card,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  mutedCard: {
    backgroundColor: AppColors.surfaceMuted,
  },
});

