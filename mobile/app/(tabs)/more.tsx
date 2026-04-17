import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { AppColors } from "@/constants/design";

const peopleModules = [
  {
    title: "Patient Management",
    owner: "Member 1",
    description: "Patient profiles, patient details, and onboarding-related screens.",
    route: "/placeholders/patients",
  },
  {
    title: "Doctor Management",
    owner: "Member 2",
    description: "Doctor profiles, specialization details, and availability screens.",
    route: "/placeholders/doctors",
  },
];

const adminModules = [
  {
    title: "Billing Management",
    owner: "Member 5",
    description: "Billing, payment status, and invoice-related workflows.",
    route: "/placeholders/billing",
  },
  {
    title: "Medical Records",
    owner: "Member 6",
    description: "Visit history, diagnosis notes, and long-term treatment records.",
    route: "/placeholders/medical-records",
  },
] as const;

export default function MoreScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        eyebrow="Care workspace"
        title="More tools"
        subtitle="Open the supporting areas of the clinic without cluttering the main tabs. Each card leads to a reserved module space."
      />

      <AppCard muted style={styles.introCard}>
        <Text style={styles.introTitle}>Keep the flow simple</Text>
        <Text style={styles.introText}>
          Friendly mobile apps keep the main journey focused, then group supporting tools in one calm place. This tab is that shared workspace.
        </Text>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People</Text>
        <Text style={styles.sectionSubtitle}>Modules that help staff manage patient and doctor information.</Text>
        <View style={styles.list}>
          {peopleModules.map((moduleLink) => (
            <Pressable key={moduleLink.title} onPress={() => router.push(moduleLink.route as any)}>
              <AppCard style={styles.card}>
                <Text style={styles.owner}>{moduleLink.owner}</Text>
                <Text style={styles.title}>{moduleLink.title}</Text>
                <Text style={styles.description}>{moduleLink.description}</Text>
              </AppCard>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operations</Text>
        <Text style={styles.sectionSubtitle}>Modules that support finance, records, and the full patient journey.</Text>
        <View style={styles.list}>
          {adminModules.map((moduleLink) => (
            <Pressable key={moduleLink.title} onPress={() => router.push(moduleLink.route as any)}>
              <AppCard style={styles.card}>
                <Text style={styles.owner}>{moduleLink.owner}</Text>
                <Text style={styles.title}>{moduleLink.title}</Text>
                <Text style={styles.description}>{moduleLink.description}</Text>
              </AppCard>
            </Pressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  introCard: {
    padding: 18,
    gap: 8,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textMuted,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 18,
    gap: 8,
  },
  owner: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.accent,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
});
