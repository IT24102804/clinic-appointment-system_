import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { UserRole } from "@/services/auth";

const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Admin", value: "admin" },
  { label: "Doctor", value: "doctor" },
  { label: "Receptionist", value: "receptionist" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { registerStaff } = useAuthSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
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
      await registerStaff({ name: name.trim(), email: email.trim(), password, role });
      router.replace("/(tabs)");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to register.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="User management" title="Create staff account" subtitle="Register an admin, doctor, or receptionist account." />

      <AppCard style={styles.card}>
        <AppInput value={name} onChangeText={setName} placeholder="Full name" />
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

        <Text style={styles.label}>Role</Text>
        <View style={styles.options}>
          {roleOptions.map((option) => (
            <AppButton
              key={option.value}
              label={option.label}
              onPress={() => setRole(option.value)}
              variant={role === option.value ? "primary" : "secondary"}
              style={styles.optionButton}
            />
          ))}
        </View>

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
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
