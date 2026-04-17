import { Text, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { AppColors } from "@/constants/design";

type ModulePlaceholderScreenProps = {
  title: string;
  owner: string;
  description: string;
  plannedScreens: string[];
  eyebrow?: string;
};

export function ModulePlaceholderScreen({
  title,
  owner,
  description,
  plannedScreens,
  eyebrow = "Module placeholder",
}: ModulePlaceholderScreenProps) {
  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />

      <AppCard style={styles.card}>
        <Text style={styles.ownerLabel}>Owned by</Text>
        <Text style={styles.ownerValue}>{owner}</Text>
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Planned screens</Text>
        <View style={styles.list}>
          {plannedScreens.map((screenName) => (
            <Text key={screenName} style={styles.listItem}>
              • {screenName}
            </Text>
          ))}
        </View>
      </AppCard>

      <AppCard muted style={styles.card}>
        <Text style={styles.sectionTitle}>Current status</Text>
        <Text style={styles.statusText}>
          Shared shell is ready. This module should now be implemented by its owner using the agreed template
          structure and shared UI components.
        </Text>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    padding: 18,
    gap: 10,
  },
  ownerLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.accent,
  },
  ownerValue: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  list: {
    gap: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
});
