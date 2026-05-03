import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { CrudRecord } from "@/types/crud";

type PatientRecordListProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyMessage: string;
  load: () => Promise<CrudRecord[]>;
  getTitle: (record: CrudRecord) => string;
  getSubtitle: (record: CrudRecord) => string;
  getHref?: (record: CrudRecord) => Href;
};

export function PatientRecordList({
  eyebrow,
  title,
  subtitle,
  emptyTitle,
  emptyMessage,
  load,
  getTitle,
  getSubtitle,
  getHref,
}: PatientRecordListProps) {
  const router = useRouter();
  const [records, setRecords] = useState<CrudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await load();
      setRecords(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords])
  );

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {loading ? (
          <StatePanel loading message={`Loading ${title.toLowerCase()}...`} />
        ) : error ? (
          <StatePanel title="Unable to load records" message={error} variant="error" actionLabel="Try again" onAction={() => void loadRecords()} />
        ) : records.length === 0 ? (
          <StatePanel title={emptyTitle} message={emptyMessage} variant="empty" />
        ) : (
          records.map((record) => {
            const href = getHref?.(record);
            const card = (
              <AppCard style={styles.card}>
                <Text style={styles.title}>{getTitle(record)}</Text>
                <Text style={styles.subtitle}>{getSubtitle(record)}</Text>
                {href ? <Text style={styles.link}>View details</Text> : null}
              </AppCard>
            );

            return href ? (
              <Pressable key={record._id} onPress={() => router.push(href)}>
                {card}
              </Pressable>
            ) : (
              <AppCard key={record._id} style={styles.card}>
                <Text style={styles.title}>{getTitle(record)}</Text>
                <Text style={styles.subtitle}>{getSubtitle(record)}</Text>
              </AppCard>
            );
          })
        )}
      </AppScreen>
    </PatientAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  card: {
    gap: 8,
    padding: 16,
  },
  title: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
});
