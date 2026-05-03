import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";

export default function RegisterScreen() {
  const router = useRouter();
  const { registerStaff } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await registerStaff({ name: name.trim(), email: email.trim(), password, role: "admin" });
      router.replace("/(tabs)");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to register.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        eyebrow="Initial setup"
        title="Create first admin"
        subtitle="This public setup screen only works before any account exists. After setup, admins create staff from Staff Accounts."
      />

      <AppCard style={styles.card}>
        <AppInput value={name} onChangeText={setName} placeholder="Full name" />
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

        <Text style={styles.label}>Role</Text>
        <Text style={styles.helperText}>Initial setup always creates an Admin account.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label="Create account" onPress={() => void submit()} busy={busy} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  helperText: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
