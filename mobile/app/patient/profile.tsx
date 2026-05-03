import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getMyProfile, PatientProfile, updateMyProfile } from "@/services/patient-portal";
import { formatDate, formatValue } from "@/utils/format-record";

export default function PatientProfileScreen() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setEmergencyName(data.emergencyContact?.name || "");
      setEmergencyPhone(data.emergencyContact?.phone || "");
      setEmergencyRelationship(data.emergencyContact?.relationship || "");
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  async function saveProfile() {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateMyProfile({
        phone: phone.trim(),
        address: address.trim(),
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
          relationship: emergencyRelationship.trim(),
        },
      });
      setProfile(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="My profile" title="Patient profile" subtitle="View your clinic profile and update contact details." />

        {loading ? (
          <StatePanel loading message="Loading profile..." />
        ) : error && !profile ? (
          <StatePanel title="Unable to load profile" message={error} variant="error" actionLabel="Try again" onAction={() => void loadProfile()} />
        ) : profile ? (
          <>
            <AppCard style={styles.card}>
              <Text style={styles.title}>{profile.fullName}</Text>
              <Text style={styles.meta}>Reference ID: {formatValue(profile.referenceId)}</Text>
              <Text style={styles.meta}>Email: {formatValue(profile.email)}</Text>
              <Text style={styles.meta}>NIC: {formatValue(profile.nic)}</Text>
              <Text style={styles.meta}>Date of birth: {formatDate(profile.dateOfBirth)}</Text>
              <Text style={styles.meta}>Gender: {formatValue(profile.gender)}</Text>
            </AppCard>

            <AppCard style={styles.card}>
              <Text style={styles.title}>Editable contact details</Text>
              <AppInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
              <AppInput value={address} onChangeText={setAddress} placeholder="Address" multiline />
              <Text style={styles.title}>Emergency contact</Text>
              <AppInput value={emergencyName} onChangeText={setEmergencyName} placeholder="Name" />
              <AppInput value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Phone" keyboardType="phone-pad" />
              <AppInput value={emergencyRelationship} onChangeText={setEmergencyRelationship} placeholder="Relationship" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <AppButton label="Save profile" onPress={() => void saveProfile()} busy={saving} />
            </AppCard>
          </>
        ) : null}
      </AppScreen>
    </PatientAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 10,
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
    lineHeight: 20,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
