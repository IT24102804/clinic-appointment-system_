import * as DocumentPicker from "expo-document-picker";
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
import { deleteMyDocument, listMyDocuments, PatientDocument, uploadMyDocument } from "@/services/patient-portal";
import { formatDate, formatValue } from "@/utils/format-record";

const documentTypes = [
  { label: "Lab report", value: "lab_report" },
  { label: "Prescription", value: "previous_prescription" },
  { label: "Scan report", value: "scan_report" },
  { label: "Referral", value: "referral_letter" },
  { label: "Other", value: "other" },
];

export default function PatientDocumentsScreen() {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("other");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMyDocuments();
      setDocuments(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDocuments();
    }, [loadDocuments])
  );

  async function uploadDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await uploadMyDocument({
        title: title.trim() || result.assets[0].name,
        description: description.trim(),
        documentType,
        asset: {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          mimeType: result.assets[0].mimeType,
        },
      });
      setTitle("");
      setDescription("");
      await loadDocuments();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload document.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDocument(id: string) {
    try {
      setBusy(true);
      setError(null);
      await deleteMyDocument(id);
      await loadDocuments();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader
          eyebrow="My documents"
          title="Supporting documents"
          subtitle="Upload lab reports, previous prescriptions, referral letters, or other files for clinic review."
        />

        <AppCard style={styles.card}>
          <Text style={styles.title}>Upload document</Text>
          <AppInput value={title} onChangeText={setTitle} placeholder="Document title" />
          <AppInput value={description} onChangeText={setDescription} placeholder="Description" multiline />
          <Text style={styles.label}>Document type</Text>
          <View style={styles.options}>
            {documentTypes.map((type) => (
              <AppButton
                key={type.value}
                label={type.label}
                onPress={() => setDocumentType(type.value)}
                variant={documentType === type.value ? "primary" : "secondary"}
                style={styles.optionButton}
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton label="Choose file and upload" onPress={() => void uploadDocument()} busy={busy} />
        </AppCard>

        {loading ? (
          <StatePanel loading message="Loading documents..." />
        ) : documents.length === 0 ? (
          <StatePanel title="No documents yet" message="Uploaded patient documents will appear here for review status tracking." variant="empty" />
        ) : (
          documents.map((document) => (
            <AppCard key={document._id} style={styles.card}>
              <Text style={styles.title}>{document.title}</Text>
              <Text style={styles.meta}>Document ID: {formatValue(document.referenceId)}</Text>
              <Text style={styles.meta}>File: {document.fileName}</Text>
              <Text style={styles.meta}>Status: {document.status}</Text>
              <Text style={styles.meta}>Uploaded: {formatDate(document.createdAt)}</Text>
              {document.reviewNotes ? <Text style={styles.meta}>Review notes: {document.reviewNotes}</Text> : null}
              {document.status === "submitted" ? (
                <AppButton label="Delete upload" variant="danger" onPress={() => void removeDocument(document._id)} busy={busy} />
              ) : null}
            </AppCard>
          ))
        )}
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
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
