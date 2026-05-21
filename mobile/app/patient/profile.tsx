import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import {
  deleteMyAdditionalAddress,
  deleteMyEmergencyContact,
  getMyProfile,
  PatientProfile,
  updateMyProfile,
} from "@/services/patient-portal";
import { formatDate, formatValue } from "@/utils/format-record";

export default function PatientProfileScreen() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [additionalAddresses, setAdditionalAddresses] = useState<{ label: string; address: string }[]>([]);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressValue, setNewAddressValue] = useState("");
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
      setAdditionalAddresses(data.additionalAddresses || []);
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
      const emergencyContact =
        emergencyName.trim() || emergencyPhone.trim() || emergencyRelationship.trim()
          ? {
              name: emergencyName.trim(),
              phone: emergencyPhone.trim(),
              relationship: emergencyRelationship.trim(),
            }
          : undefined;
      const updated = await updateMyProfile({
        phone: phone.trim(),
        address: address.trim(),
        ...(emergencyContact ? { emergencyContact } : {}),
        additionalAddresses,
      });
      setProfile(updated);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function addAddress() {
    if (additionalAddresses.length >= 2) {
      setError("You can add up to 2 additional addresses.");
      return;
    }

    if (!newAddressValue.trim()) {
      setError("Additional address cannot be empty.");
      return;
    }

    setAdditionalAddresses((current) => [
      ...current,
      {
        label: newAddressLabel.trim() || "Other",
        address: newAddressValue.trim(),
      },
    ]);
    setNewAddressLabel("");
    setNewAddressValue("");
    setError(null);
  }

  function removeAddress(index: number) {
    async function remove() {
      try {
        setSaving(true);
        setError(null);
        const updated = await deleteMyAdditionalAddress(index);
        setProfile(updated);
        setAdditionalAddresses(updated.additionalAddresses || []);
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Unable to delete additional address.");
      } finally {
        setSaving(false);
      }
    }

    void remove();
  }

  async function clearEmergencyContact() {
    try {
      setSaving(true);
      setError(null);
      const updated = await deleteMyEmergencyContact();
      setProfile(updated);
      setEmergencyName("");
      setEmergencyPhone("");
      setEmergencyRelationship("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete emergency contact.");
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
              <Text style={styles.meta}>Age: {formatValue(profile.age)}</Text>
            </AppCard>

            <AppCard style={styles.card}>
              <Text style={styles.title}>Editable contact details</Text>
              <AppInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
              <AppInput value={address} onChangeText={setAddress} placeholder="Address" multiline />
              <Text style={styles.title}>Emergency contact</Text>
              <AppInput value={emergencyName} onChangeText={setEmergencyName} placeholder="Name" />
              <AppInput value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Phone" keyboardType="phone-pad" />
              <AppInput value={emergencyRelationship} onChangeText={setEmergencyRelationship} placeholder="Relationship" />
              <AppButton label="Delete emergency contact" variant="secondary" onPress={() => void clearEmergencyContact()} />

              <Text style={styles.title}>Additional addresses</Text>
              <Text style={styles.meta}>{additionalAddresses.length} of 2 additional addresses added.</Text>
              {additionalAddresses.length === 0 ? (
                <Text style={styles.meta}>No additional addresses added.</Text>
              ) : (
                additionalAddresses.map((item, index) => (
                  <View key={`${item.label}-${index}`} style={styles.addressRow}>
                    <View style={styles.addressText}>
                      <Text style={styles.addressLabel}>{item.label || "Other"}</Text>
                      <Text style={styles.meta}>{item.address}</Text>
                    </View>
                    <AppButton label="Remove" variant="secondary" onPress={() => removeAddress(index)} style={styles.removeButton} />
                  </View>
                ))
              )}
              {additionalAddresses.length < 2 ? (
                <>
                  <AppInput value={newAddressLabel} onChangeText={setNewAddressLabel} placeholder="Address label, for example Home" />
                  <AppInput value={newAddressValue} onChangeText={setNewAddressValue} placeholder="Additional address" multiline />
                  <AppButton label="Add address" variant="secondary" onPress={addAddress} />
                </>
              ) : null}

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
  addressRow: {
    alignItems: "center",
    borderColor: AppColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  addressText: {
    flex: 1,
    gap: 2,
  },
  addressLabel: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
