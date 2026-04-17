import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppColors } from "@/constants/design";

type StateVariant = "default" | "error" | "empty";

type StatePanelProps = {
  title?: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  variant?: StateVariant;
};

export function StatePanel({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
  variant = "default",
}: StatePanelProps) {
  const titleStyle = variant === "error" ? styles.errorTitle : styles.title;
  const buttonVariant = variant === "error" ? "danger" : "secondary";

  return (
    <AppCard style={styles.card}>
      {loading ? <ActivityIndicator size="large" color={AppColors.accent} /> : null}
      {title ? <Text style={titleStyle}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} variant={buttonVariant} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.text,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.danger,
    textAlign: "center",
  },
  message: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
