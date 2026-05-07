import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getAuthToken } from "@/services/api-client";
import { createUser, deactivateUser, listUsers, updateUser, User, UserRole } from "@/services/auth";

const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Admin", value: "admin" },
  { label: "Doctor", value: "doctor" },
  { label: "Receptionist", value: "receptionist" },
];

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("receptionist");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordUpdates, setPasswordUpdates] = useState<Record<string, string>>({});
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  const loadUsers = useCallback(async (showRefresh = false) => {
    if (!getAuthToken()) {
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await listUsers();
      setUsers(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  if (!hasToken) {
    return (
      <AppScreen style={{ justifyContent: "center" }}>
        <StatePanel
          title="Login required"
          message="Login as an admin account to manage staff users."
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  async function submit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await createUser({ name: name.trim(), email: email.trim(), password, role });
      setName("");
      setEmail("");
      setPassword("");
      await loadUsers(true);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create user.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    try {
      setBusy(true);
      await deactivateUser(id);
      await loadUsers(true);
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : "Unable to deactivate user.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(user: User) {
    const nextPassword = passwordUpdates[user._id]?.trim();

    if (!nextPassword) {
      setError("Enter a new password before updating.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await updateUser(user._id, { password: nextPassword });
      setPasswordUpdates((current) => ({ ...current, [user._id]: "" }));
      setPasswordUserId(null);
      await loadUsers(true);
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="Admin" title="Staff accounts" subtitle="Create and manage admin, doctor, and receptionist login accounts." />

      <AppCard style={styles.card}>
        <Text style={styles.sectionTitle}>Create staff account</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Full name" />
        <AppInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <AppInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
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
        <AppButton label="Create user" onPress={() => void submit()} busy={busy} />
      </AppCard>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <StatePanel loading message="Loading staff users..." />
      ) : (
        <FlatList
          data={users}
          scrollEnabled={false}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadUsers(true)} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.itemGroup}>
              <AppCard style={styles.card}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userMeta}>Reference ID: {item.referenceId || "Not generated"}</Text>
                <Text style={styles.userMeta}>{item.email}</Text>
                <Text style={styles.userMeta}>{item.role} | {item.status}</Text>
                <AppButton
                  label={passwordUserId === item._id ? "Cancel password change" : "Change password"}
                  variant="secondary"
                  onPress={() => setPasswordUserId((current) => (current === item._id ? null : item._id))}
                />
                {item.status === "active" ? (
                  <AppButton label="Deactivate" variant="danger" onPress={() => void deactivate(item._id)} busy={busy} />
                ) : null}
              </AppCard>
              {passwordUserId === item._id ? (
                <AppCard muted style={styles.passwordCard}>
                  <Text style={styles.sectionTitle}>Update password</Text>
                  <Text style={styles.userMeta}>{item.name} | {item.email}</Text>
                  <AppInput
                    value={passwordUpdates[item._id] || ""}
                    onChangeText={(value) => setPasswordUpdates((current) => ({ ...current, [item._id]: value }))}
                    placeholder="New password"
                    secureTextEntry
                  />
                  <AppButton label="Save new password" onPress={() => void changePassword(item)} busy={busy} />
                </AppCard>
              ) : null}
            </View>
          )}
        />
      )}
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
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
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
  itemGroup: {
    gap: 8,
  },
  passwordCard: {
    gap: 8,
    padding: 14,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  userName: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  userMeta: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
});
