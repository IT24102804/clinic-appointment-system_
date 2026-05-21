import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";

const peopleModules = [
  {
    title: "Patients",
    owner: "Clinic records",
    description: "Manage patient profiles, contact details, documents, and active status.",
    route: "/patients",
  },
  {
    title: "Doctors",
    owner: "Care team",
    description: "Manage doctors, specializations, room details, and availability.",
    route: "/doctors",
  },
];

const adminModules = [
  {
    title: "Billing",
    owner: "Payments",
    description: "Create bills, track payment status, and attach receipts.",
    route: "/billing",
  },
  {
    title: "Medical Records",
    owner: "Clinical history",
    description: "Review visit summaries, diagnoses, treatments, and reports.",
    route: "/medical-records",
  },
  {
    title: "Patient Documents",
    owner: "Submissions",
    description: "Review supporting documents uploaded by patients.",
    route: "/patient-documents",
  },
  {
    title: "Staff Accounts",
    owner: "Access control",
    description: "Manage admin, doctor, and receptionist login access.",
    route: "/users",
    adminOnly: true,
  },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuthSession();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        eyebrow="Clinic menu"
        title="More"
        subtitle="Open patient records, care-team details, billing, history, and staff access."
      />

      <AppCard muted style={styles.introCard}>
        <Text style={styles.introTitle}>Clinic support modules</Text>
        <Text style={styles.introText}>Use this area for records that support appointment booking and follow-up care.</Text>
        <Text style={styles.introText}>{user?.name ? `Logged in as ${user.name}` : "Staff account"}</Text>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People</Text>
        <Text style={styles.sectionSubtitle}>Profiles used when booking appointments and creating clinical records.</Text>
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
        <Text style={styles.sectionSubtitle}>Billing, medical history, and staff access for daily clinic work.</Text>
        <View style={styles.list}>
          {adminModules.filter((moduleLink) => !moduleLink.adminOnly || user?.role === "admin").map((moduleLink) => (
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

      <AppButton label="Logout" variant="danger" onPress={() => void handleLogout()} />
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
