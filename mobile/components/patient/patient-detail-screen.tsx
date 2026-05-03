import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { CrudRecord } from "@/types/crud";

type DetailRow = {
  label: string;
  value: string;
};

type PatientDetailScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  load: (id: string) => Promise<CrudRecord>;
  getRows: (record: CrudRecord) => DetailRow[];
  attachmentUrlKey?: string;
  attachmentNameKey?: string;
  backLabel: string;
};

function Row({ label, value }: DetailRow) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function PatientDetailScreen({
  eyebrow,
  title,
  subtitle,
  load,
  getRows,
  attachmentUrlKey = "attachmentUrl",
  attachmentNameKey = "attachmentName",
  backLabel,
}: PatientDetailScreenProps) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<CrudRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecord = useCallback(async () => {
    if (!id) {
      setError("Record ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await load(id);
      setRecord(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
    } finally {
      setLoading(false);
    }
  }, [id, load]);

  useFocusEffect(
    useCallback(() => {
      void loadRecord();
    }, [loadRecord])
  );

  const attachmentUrl = typeof record?.[attachmentUrlKey] === "string" ? record[attachmentUrlKey] : "";
  const attachmentName = typeof record?.[attachmentNameKey] === "string" ? record[attachmentNameKey] : "";

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

        {loading ? (
          <StatePanel loading message="Loading details..." />
        ) : error ? (
          <StatePanel title="Unable to load details" message={error} variant="error" actionLabel="Try again" onAction={() => void loadRecord()} />
        ) : record ? (
          <>
            <AppCard style={styles.card}>
              <Row label="Reference ID" value={record.referenceId || "Not generated"} />
              {getRows(record).map((row) => (
                <Row key={row.label} label={row.label} value={row.value} />
              ))}
            </AppCard>

            {attachmentUrl ? (
              <AppCard muted style={styles.card}>
                <Text style={styles.sectionTitle}>Attachment</Text>
                <Text style={styles.value}>{attachmentName || "Uploaded attachment"}</Text>
                <AppButton label="Open attachment" variant="secondary" onPress={() => void Linking.openURL(attachmentUrl)} />
              </AppCard>
            ) : null}
          </>
        ) : (
          <StatePanel title="Record not found" message="This record may have been removed." variant="empty" />
        )}

        <AppButton label={backLabel} variant="secondary" onPress={() => router.back()} />
      </AppScreen>
    </PatientAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  row: {
    gap: 4,
  },
  label: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
});
