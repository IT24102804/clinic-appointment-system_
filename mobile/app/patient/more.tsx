import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";

export default function PatientMoreScreen() {
  const router = useRouter();
  const { logout, user } = useAuthSession();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="Patient menu" title="More" subtitle="Open your patient tools or logout." />

        <AppCard style={styles.card}>
          <Text style={styles.title}>{user?.name}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>Role: patient</Text>
        </AppCard>

        <AppButton label="Profile" variant="secondary" onPress={() => router.push("/patient/profile")} />
        <AppButton label="My documents" variant="secondary" onPress={() => router.push("/patient/documents")} />
        <AppButton label="Logout" variant="danger" onPress={() => void handleLogout()} />
      </AppScreen>
    </PatientAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 8,
    padding: 16,
  },
  title: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
});
