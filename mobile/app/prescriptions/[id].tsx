import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { toApiUrl } from "@/constants/api";
import { AppColors } from "@/constants/design";
import { getAuthToken } from "@/services/api-client";
import {
  deletePrescription,
  deletePrescriptionAttachment,
  getPrescription,
  uploadPrescriptionAttachment,
} from "@/services/prescriptions";
import { Prescription } from "@/types/prescription";
import { formatDateTime, formatRef, getRefId } from "@/utils/format-record";

function formatDate(value?: string) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

export default function PrescriptionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  const absoluteAttachmentUrl = useMemo(() => {
    if (!prescription?.attachmentUrl) {
      return null;
    }

    return toApiUrl(prescription.attachmentUrl);
  }, [prescription?.attachmentUrl]);

  const loadPrescription = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      setError(null);
      return;
    }

    if (!id) {
      return;
    }

    try {
      setLoading(true);
      const data = await getPrescription(id);
      setPrescription(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load prescription details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadPrescription();
    }, [loadPrescription])
  );

  if (!hasToken) {
    return (
      <AppScreen style={styles.centeredScreen}>
        <StatePanel
          title="Login required"
          message="Login with a staff account to view prescription details."
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  async function handleUploadAttachment() {
    if (!id) {
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    try {
      setBusyAction("upload");
      const updatedPrescription = await uploadPrescriptionAttachment(id, result.assets[0]);
      setPrescription(updatedPrescription);
      Alert.alert("Attachment uploaded", "The prescription attachment was saved.");
    } catch (uploadError) {
      Alert.alert("Upload failed", uploadError instanceof Error ? uploadError.message : "Unable to upload attachment.");
    } finally {
      setBusyAction(null);
    }
  }

  function handleDeletePrescription() {
    if (!id) {
      return;
    }

    Alert.alert("Delete prescription", "This will permanently remove the prescription record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusyAction("delete");
            await deletePrescription(id);
            router.replace("/prescriptions");
          } catch (deleteError) {
            Alert.alert(
              "Delete failed",
              deleteError instanceof Error ? deleteError.message : "Unable to delete the prescription."
            );
          } finally {
            setBusyAction(null);
          }
        },
      },
    ]);
  }

  async function handleDeleteAttachment() {
    if (!id) {
      return;
    }

    try {
      setBusyAction("remove-attachment");
      const updatedPrescription = await deletePrescriptionAttachment(id);
      setPrescription(updatedPrescription);
      Alert.alert("Attachment removed", "The attachment was removed from the prescription.");
    } catch (deleteError) {
      Alert.alert(
        "Unable to remove attachment",
        deleteError instanceof Error ? deleteError.message : "Attachment removal failed."
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <AppScreen style={styles.centeredScreen}>
        <StatePanel loading message="Loading prescription details..." />
      </AppScreen>
    );
  }

  if (error || !prescription) {
    return (
      <AppScreen style={styles.centeredScreen}>
        <StatePanel
          title="Prescription unavailable"
          message={error || "The requested prescription could not be found."}
          variant="error"
          actionLabel="Retry"
          onAction={() => void loadPrescription()}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        tone="hero"
        eyebrow="Prescription details"
        title={prescription.diagnosis}
        subtitle={`Issued at: ${formatDate(prescription.issuedAt || prescription.createdAt)}`}
        rightContent={
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{(prescription.status || "draft").toUpperCase()}</Text>
          </View>
        }
      />

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>References</Text>
        <Text style={styles.detailText}>Reference ID: {prescription.referenceId || "Not generated"}</Text>
        <Text style={styles.detailText}>MongoDB ID: {prescription._id}</Text>
        <Text style={styles.detailText}>Appointment: {formatRef(prescription.appointmentId)}</Text>
        <Text style={styles.detailText}>Appointment ID: {getRefId(prescription.appointmentId) || "Not set"}</Text>
        <Text style={styles.detailText}>Patient: {formatRef(prescription.patientId)}</Text>
        <Text style={styles.detailText}>Patient ID: {getRefId(prescription.patientId) || "Not set"}</Text>
        <Text style={styles.detailText}>Doctor: {formatRef(prescription.doctorId)}</Text>
        <Text style={styles.detailText}>Doctor ID: {getRefId(prescription.doctorId) || "Not set"}</Text>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Record timestamps</Text>
        <Text style={styles.detailText}>Created at: {formatDateTime(prescription.createdAt) || "Not set"}</Text>
        <Text style={styles.detailText}>Last updated: {formatDateTime(prescription.updatedAt) || "Not set"}</Text>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Medicines</Text>
        {prescription.medicines.map((medicine, index) => (
          <AppCard key={`${medicine.name}-${index}`} muted style={styles.medicineCard}>
            <Text style={styles.medicineTitle}>{medicine.name}</Text>
            <Text style={styles.detailText}>Dosage: {medicine.dosage}</Text>
            <Text style={styles.detailText}>Frequency: {medicine.frequency}</Text>
            <Text style={styles.detailText}>Duration: {medicine.duration}</Text>
            {medicine.instructions ? <Text style={styles.detailText}>Instructions: {medicine.instructions}</Text> : null}
          </AppCard>
        ))}
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.detailText}>{prescription.notes || "No extra notes recorded."}</Text>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Attachment</Text>
        {prescription.attachmentUrl && absoluteAttachmentUrl ? (
          <>
            <Text style={styles.detailText}>Saved file: {prescription.attachmentName || "Attachment"}</Text>
            <View style={styles.inlineActions}>
              <AppButton label="Open file" onPress={() => void Linking.openURL(absoluteAttachmentUrl)} variant="secondary" style={styles.inlineButton} />
              <AppButton
                label={busyAction === "remove-attachment" ? "Removing..." : "Remove file"}
                onPress={() => void handleDeleteAttachment()}
                variant="danger"
                busy={busyAction === "remove-attachment"}
                style={styles.inlineButton}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.detailText}>No attachment uploaded yet.</Text>
            <AppButton
              label={busyAction === "upload" ? "Uploading..." : "Upload PDF or image"}
              onPress={() => void handleUploadAttachment()}
              variant="secondary"
              busy={busyAction === "upload"}
            />
          </>
        )}
      </AppCard>

      <View style={styles.footerActions}>
        <AppButton
          label="Edit prescription"
          onPress={() =>
            router.push({
              pathname: "/prescriptions/[id]/edit",
              params: { id },
            })
          }
        />
        <AppButton
          label={busyAction === "delete" ? "Deleting..." : "Delete prescription"}
          onPress={handleDeletePrescription}
          variant="danger"
          busy={busyAction === "delete"}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    justifyContent: "center",
  },
  screen: {
    gap: 16,
  },
  statusPill: {
    backgroundColor: AppColors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    color: AppColors.accent,
    fontWeight: "800",
    fontSize: 12,
  },
  section: {
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.text,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
  medicineCard: {
    padding: 14,
    gap: 6,
  },
  medicineTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.text,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  inlineButton: {
    minWidth: 132,
  },
  footerActions: {
    gap: 12,
    paddingBottom: 24,
  },
});
