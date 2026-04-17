import { TextInput, TextInputProps, StyleSheet } from "react-native";

import { AppColors, AppRadius, AppSpacing } from "@/constants/design";

type AppInputProps = TextInputProps & {
  multiline?: boolean;
};

export function AppInput({ multiline = false, style, ...props }: AppInputProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : props.textAlignVertical}
      style={[styles.input, multiline && styles.multilineInput, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppRadius.input,
    paddingHorizontal: AppSpacing.inputHorizontal,
    paddingVertical: AppSpacing.inputVertical,
    backgroundColor: AppColors.surface,
    fontSize: 15,
    color: AppColors.text,
  },
  multilineInput: {
    minHeight: 92,
  },
});

