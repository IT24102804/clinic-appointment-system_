import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getAuthToken } from "@/services/api-client";
import { getUser, resetUserPassword, User } from "@/services/auth";

export default function UserPasswordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  const loadUser = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setUser(await getUser(id));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load user account.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function savePassword() {
    if (!id) {
      return;
    }

    if (!password || password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await resetUserPassword(id, password);
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  if (!hasToken) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel title="Login required" message="Login as admin to update user passwords." actionLabel="Go to login" onAction={() => router.push("/auth/login")} />
      </AppScreen>
    );
  }

  if (loading) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel loading message="Loading user account..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="Admin security" title="Update user password" subtitle={user ? `${user.name} | ${user.email} | ${user.role}` : "User account"} />

      <AppCard style={styles.card}>
        <Text style={styles.meta}>Use a strong password with uppercase, lowercase, number, and special character.</Text>
        <AppInput value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry />
        <AppInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label="Save password" onPress={() => void savePassword()} busy={saving} />
        <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} disabled={saving} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
  },
  screen: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
