import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppColors, AppRadius, AppSpacing } from "@/constants/design";

type HeaderTone = "plain" | "hero";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  tone?: HeaderTone;
  rightContent?: ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  tone = "plain",
  rightContent,
}: PageHeaderProps) {
  const hero = tone === "hero";

  return (
    <View style={[styles.wrapper, hero && styles.heroWrapper]}>
      <View style={styles.headerRow}>
        <View style={styles.copyBlock}>
          {eyebrow ? <Text style={[styles.eyebrow, hero && styles.heroEyebrow]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, hero && styles.heroTitle]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, hero && styles.heroSubtitle]}>{subtitle}</Text> : null}
        </View>
        {rightContent ? <View>{rightContent}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    marginBottom: 18,
  },
  heroWrapper: {
    backgroundColor: AppColors.primary,
    borderRadius: AppRadius.hero,
    padding: AppSpacing.heroPadding,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  copyBlock: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    color: AppColors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroEyebrow: {
    color: AppColors.eyebrow,
  },
  title: {
    color: AppColors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  heroTitle: {
    color: AppColors.heroText,
    fontSize: 32,
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroSubtitle: {
    color: AppColors.heroSubtext,
  },
});

