import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getAuthToken } from "@/services/api-client";
import { CrudRecord, ModuleConfig } from "@/types/crud";

type CrudService<TRecord extends CrudRecord> = {
  list: () => Promise<TRecord[]>;
};

type ModuleListScreenProps<TRecord extends CrudRecord> = {
  config: ModuleConfig;
  service: CrudService<TRecord>;
};

export function ModuleListScreen<TRecord extends CrudRecord>({ config, service }: ModuleListScreenProps<TRecord>) {
  const router = useRouter();
  const [records, setRecords] = useState<TRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  const loadRecords = useCallback(
    async (showRefresh = false) => {
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

        const data = await service.list();
        setRecords(data);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : `Unable to load ${config.listTitle.toLowerCase()}.`);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [config.listTitle, service]
  );

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords])
  );

  if (!hasToken) {
    return (
      <AppScreen style={styles.stateWrapper}>
        <StatePanel
          title="Login required"
          message={`Login with a staff account to access ${config.listTitle.toLowerCase()}.`}
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.listTitle}
        subtitle={`Create, review, update, and delete ${config.listTitle.toLowerCase()} from the live API.`}
      />

      <AppButton label={config.createTitle} onPress={() => router.push(`${config.basePath}/new` as any)} />

      {loading ? (
        <View style={styles.stateWrapper}>
          <StatePanel loading message={`Loading ${config.listTitle.toLowerCase()}...`} />
        </View>
      ) : error ? (
        <View style={styles.stateWrapper}>
          <StatePanel title="Unable to load records" message={error} variant="error" actionLabel="Try again" onAction={() => void loadRecords()} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.stateWrapper}>
          <StatePanel title="No records yet" message={`Create the first ${config.title.toLowerCase()} record.`} variant="empty" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadRecords(true)} />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <Text style={styles.cardTitle}>{config.getCardTitle(item)}</Text>
              <Text style={styles.cardSubtitle}>{config.getCardSubtitle(item)}</Text>
              <AppButton
                label="Open details"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: `${config.basePath}/[id]` as any,
                    params: { id: item._id },
                  })
                }
              />
            </AppCard>
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
  stateWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 14,
    paddingBottom: 28,
  },
  card: {
    gap: 10,
    padding: 16,
  },
  cardTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
