import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const user = await login({ email: email.trim(), password });
      router.replace(user.role === "patient" ? "/patient/home" : user.role === "doctor" ? "/doctor/home" : "/(tabs)");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to login.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="Clinic access" title="Login" subtitle="Use a patient or staff account to access the clinic system." />

      <AppCard style={styles.card}>
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label="Login" onPress={() => void submit()} busy={busy} />
        <Link href="/auth/register" style={styles.link}>
          Create first staff account
        </Link>
        <Link href="/auth/register-patient" style={styles.link}>
          Register as patient
        </Link>
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
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
  link: {
    color: AppColors.accent,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
