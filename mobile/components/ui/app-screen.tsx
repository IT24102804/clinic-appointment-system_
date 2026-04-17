import { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { AppColors, AppSpacing } from "@/constants/design";

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({ children, scroll = false, style, contentContainerStyle }: AppScreenProps) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.base}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle, style]}>
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.base, styles.staticContent, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  staticContent: {
    paddingHorizontal: AppSpacing.screenHorizontal,
    paddingTop: AppSpacing.screenTop,
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.screenHorizontal,
    paddingTop: AppSpacing.screenTop,
    paddingBottom: 24,
  },
});

