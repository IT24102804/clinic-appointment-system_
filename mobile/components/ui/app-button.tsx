import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { AppColors, AppRadius } from "@/constants/design";

type ButtonVariant = "primary" | "secondary" | "danger";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  busy = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const activeVariant = buttonVariantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={[styles.button, activeVariant.button, (disabled || busy) && styles.disabled, style]}>
      {busy ? <ActivityIndicator color={activeVariant.text.color} /> : <Text style={[styles.text, activeVariant.text]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: AppRadius.button,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.7,
  },
});

const variantStyleSheet = StyleSheet.create({
  primaryButton: {
    backgroundColor: AppColors.accent,
  },
  secondaryButton: {
    backgroundColor: AppColors.accentSoft,
  },
  dangerButton: {
    backgroundColor: AppColors.danger,
  },
  primaryText: {
    color: AppColors.heroText,
  },
  secondaryText: {
    color: AppColors.accent,
  },
  dangerText: {
    color: AppColors.heroText,
  },
});

const buttonVariantStyles = {
  primary: {
    button: variantStyleSheet.primaryButton,
    text: variantStyleSheet.primaryText,
  },
  secondary: {
    button: variantStyleSheet.secondaryButton,
    text: variantStyleSheet.secondaryText,
  },
  danger: {
    button: variantStyleSheet.dangerButton,
    text: variantStyleSheet.dangerText,
  },
} as const;
