import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { getAuthToken } from "@/services/api-client";
import { listPatientDocuments, reviewPatientDocument, StaffPatientDocument } from "@/services/patient-documents";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

const statusOptions = ["reviewed", "rejected"];

function statusLabel(status: string) {
  return status === "reviewed" ? "Reviewed" : status === "rejected" ? "Rejected" : "Submitted";
}

function statusStyle(status: string) {
  if (status === "reviewed") {
    return styles.statusReviewed;
  }

  if (status === "rejected") {
    return styles.statusRejected;
  }

  return styles.statusSubmitted;
}

export default function StaffPatientDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [documents, setDocuments] = useState<StaffPatientDocument[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listPatientDocuments();
      setDocuments(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load patient documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDocuments();
    }, [loadDocuments])
  );

  if (!getAuthToken()) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel title="Login required" message="Login as staff to review patient documents." actionLabel="Go to login" onAction={() => router.push("/auth/login")} />
      </AppScreen>
    );
  }

  if (user?.role === "patient") {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel title="Staff access only" message="Patient document review is available for clinic staff." variant="error" />
      </AppScreen>
    );
  }

  async function review(id: string, status: string) {
    try {
      setBusy(true);
      await reviewPatientDocument(id, {
        status,
        reviewNotes: reviewNotes[id] || "",
      });
      await loadDocuments();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="Patient submissions" title="Patient documents" subtitle="Review supporting medical documents uploaded by patients." />

      {loading ? (
        <StatePanel loading message="Loading patient documents..." />
      ) : error ? (
        <StatePanel title="Unable to load documents" message={error} variant="error" actionLabel="Try again" onAction={() => void loadDocuments()} />
      ) : documents.length === 0 ? (
        <StatePanel title="No uploaded documents" message="Patient submissions will appear here." variant="empty" />
      ) : (
        documents.map((document) => (
          <AppCard key={document._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{document.title}</Text>
              <View style={[styles.statusBadge, statusStyle(document.status)]}>
                <Text style={styles.statusText}>{statusLabel(document.status)}</Text>
              </View>
            </View>
            <Text style={styles.meta}>Document ID: {formatValue(document.referenceId)}</Text>
            <Text style={styles.meta}>Patient: {formatRef(document.patientId)}</Text>
            <Text style={styles.meta}>File: {document.fileName}</Text>
            <Text style={styles.meta}>Type: {document.documentType}</Text>
            <Text style={styles.meta}>Uploaded: {formatDate(document.createdAt)}</Text>
            {document.reviewNotes ? <Text style={styles.meta}>Review notes: {document.reviewNotes}</Text> : null}
            {document.reviewedBy ? (
              <Text style={styles.meta}>Reviewed by: {formatRef(document.reviewedBy)}</Text>
            ) : null}
            <AppButton label="Open file" variant="secondary" onPress={() => void Linking.openURL(document.fileUrl)} />
            {document.status === "submitted" ? (
              <>
                <AppInput
                  value={reviewNotes[document._id] || ""}
                  onChangeText={(value) => setReviewNotes((current) => ({ ...current, [document._id]: value }))}
                  placeholder="Review notes"
                  multiline
                />
                <View style={styles.options}>
                  {statusOptions.map((status) => (
                    <AppButton
                      key={status}
                      label={status === "reviewed" ? "Accept document" : "Reject document"}
                      onPress={() => void review(document._id, status)}
                      variant={status === "reviewed" ? "primary" : "danger"}
                      busy={busy}
                      style={styles.optionButton}
                    />
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.reviewComplete}>Review completed. This submission is now locked for staff tracking.</Text>
            )}
          </AppCard>
        ))
      )}
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
    gap: 10,
    padding: 16,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusSubmitted: {
    backgroundColor: AppColors.warningSoft,
  },
  statusReviewed: {
    backgroundColor: AppColors.successSoft,
  },
  statusRejected: {
    backgroundColor: AppColors.warningSoft,
  },
  statusText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewComplete: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "700",
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
});
