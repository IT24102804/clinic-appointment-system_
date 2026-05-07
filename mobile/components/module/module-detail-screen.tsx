import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { getAuthToken } from "@/services/api-client";
import { CrudRecord, ModuleConfig, UploadAsset } from "@/types/crud";
import { formatDate, formatDateTime, formatValue } from "@/utils/format-record";

type CrudService<TRecord extends CrudRecord> = {
  get: (id: string) => Promise<TRecord>;
  remove: (id: string) => Promise<{ id: string }>;
  uploadAttachment: (id: string, asset: UploadAsset) => Promise<TRecord>;
  deleteAttachment: (id: string) => Promise<TRecord>;
};

type ModuleDetailScreenProps<TRecord extends CrudRecord> = {
  config: ModuleConfig;
  service: CrudService<TRecord>;
};

export function ModuleDetailScreen<TRecord extends CrudRecord>({ config, service }: ModuleDetailScreenProps<TRecord>) {
  const router = useRouter();
  const { user } = useAuthSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [record, setRecord] = useState<TRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  const loadRecord = useCallback(async () => {
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
      const data = await service.get(id);
      setRecord(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
    } finally {
      setLoading(false);
    }
  }, [id, service]);

  useFocusEffect(
    useCallback(() => {
      void loadRecord();
    }, [loadRecord])
  );

  if (!hasToken) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel
          title="Login required"
          message="Login with a staff account to view and manage this record."
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  async function deleteRecord() {
    if (!id) {
      return;
    }

    try {
      setBusy(true);
      await service.remove(id);
      router.back();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete record.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment() {
    if (!id) {
      return;
    }

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
      const updated = await service.uploadAttachment(id, {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        mimeType: result.assets[0].mimeType,
      });
      setRecord(updated);
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload attachment.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAttachment() {
    if (!id) {
      return;
    }

    try {
      setBusy(true);
      const updated = await service.deleteAttachment(id);
      setRecord(updated);
      setError(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove attachment.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel loading message="Loading record..." />
      </AppScreen>
    );
  }

  if (error && !record) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel title="Unable to load record" message={error} variant="error" actionLabel="Try again" onAction={() => void loadRecord()} />
      </AppScreen>
    );
  }

  if (!record) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel title="Record not found" message="This record may have been deleted." variant="empty" />
      </AppScreen>
    );
  }

  const attachmentUrlKey = config.attachmentUrlKey || "attachmentUrl";
  const attachmentNameKey = config.attachmentNameKey || "attachmentName";
  const attachmentUrl = typeof record[attachmentUrlKey] === "string" ? record[attachmentUrlKey] : "";
  const attachmentName = typeof record[attachmentNameKey] === "string" ? record[attachmentNameKey] : "";
  const isDoctorPatientDetail = config.key === "patients" && user?.role === "doctor";
  const detailRows = isDoctorPatientDetail
    ? [
        { label: "Patient name", value: formatValue(record.fullName) },
        { label: "Phone", value: formatValue(record.phone) },
        { label: "Date of birth", value: formatDate(record.dateOfBirth) },
        { label: "Age", value: formatValue(record.age) },
      ]
    : config.getDetailRows(record);

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow={config.eyebrow} title={config.detailTitle} subtitle={config.getCardTitle(record)} />

      <AppCard style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Reference ID</Text>
          <Text style={styles.value}>{record.referenceId || "Not generated"}</Text>
        </View>
        {!isDoctorPatientDetail ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Created at</Text>
              <Text style={styles.value}>{formatDateTime(record.createdAt) || "Not set"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Last updated</Text>
              <Text style={styles.value}>{formatDateTime(record.updatedAt) || "Not set"}</Text>
            </View>
          </>
        ) : null}
        {detailRows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </AppCard>

      {!isDoctorPatientDetail ? (
        <AppCard muted style={styles.card}>
          <Text style={styles.sectionTitle}>{config.attachmentLabel || "Attachment"}</Text>
          <Text style={styles.value}>{attachmentName || "No attachment uploaded yet."}</Text>
          {attachmentUrl ? <AppButton label="Open attachment" variant="secondary" onPress={() => void Linking.openURL(attachmentUrl)} /> : null}
          <AppButton label={attachmentUrl ? "Replace attachment" : "Upload attachment"} onPress={() => void uploadAttachment()} busy={busy} />
          {attachmentUrl ? <AppButton label="Remove attachment" variant="danger" onPress={() => void removeAttachment()} busy={busy} /> : null}
        </AppCard>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isDoctorPatientDetail ? (
        <>
          <AppButton
            label="Edit record"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: `${config.basePath}/[id]/edit` as any,
                params: { id: record._id },
              })
            }
          />
          <AppButton label="Delete record" variant="danger" onPress={() => void deleteRecord()} busy={busy} />
        </>
      ) : null}
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
    gap: 14,
    padding: 16,
  },
  row: {
    gap: 4,
  },
  label: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: AppColors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
