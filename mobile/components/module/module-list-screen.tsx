import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { getAuthToken } from "@/services/api-client";
import { CrudRecord, ModuleConfig } from "@/types/crud";

type CrudService<TRecord extends CrudRecord> = {
  list: () => Promise<TRecord[]>;
};

type ModuleListScreenProps<TRecord extends CrudRecord> = {
  config: ModuleConfig;
  service: CrudService<TRecord>;
};

function canCreateRecord(moduleKey: string, role?: string) {
  if (role === "admin") {
    return true;
  }

  if (role === "receptionist") {
    return ["patients", "doctors", "appointments", "billing"].includes(moduleKey);
  }

  return role === "doctor" && moduleKey === "medical-records";
}

export function ModuleListScreen<TRecord extends CrudRecord>({ config, service }: ModuleListScreenProps<TRecord>) {
  const router = useRouter();
  const { user } = useAuthSession();
  const [records, setRecords] = useState<TRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const hasToken = Boolean(getAuthToken());
  const isPatientList = config.key === "patients";
  const showPatientFilters = isPatientList;
  const filterFields = useMemo(
    () =>
      showPatientFilters
        ? config.fields.filter((field) => ["gender", "status"].includes(field.key) && field.options?.length)
        : [],
    [config.fields, showPatientFilters]
  );

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

  const filteredRecords = useMemo(() => {
    if (!isPatientList) {
      return records;
    }

    const searchValue = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !searchValue ||
        [
          config.getCardTitle(record),
          config.getCardSubtitle(record),
          record.referenceId,
          record.nic,
          record.email,
          record.phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchValue);

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value || value === "all") {
          return true;
        }

        return String(record[key] ?? "") === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [config, filters, isPatientList, records, search]);

  function updateFilter(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

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

      {canCreateRecord(config.key, user?.role) ? (
        <AppButton label={config.createTitle} onPress={() => router.push(`${config.basePath}/new` as any)} />
      ) : null}

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
        <>
          {showPatientFilters ? (
            <AppCard style={styles.filterCard}>
              <Text style={styles.resultCount}>
                Showing {filteredRecords.length} of {records.length} patients
              </Text>
              <AppInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, NIC, phone, email"
                autoCapitalize="none"
              />
              {filterFields.map((field) => (
                <View key={field.key} style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>{field.label}</Text>
                  <View style={styles.filterOptions}>
                    <AppButton
                      label="All"
                      onPress={() => updateFilter(field.key, "all")}
                      variant={!filters[field.key] || filters[field.key] === "all" ? "primary" : "secondary"}
                      style={styles.filterButton}
                    />
                    {field.options?.map((option) => (
                      <AppButton
                        key={option.value}
                        label={option.label}
                        onPress={() => updateFilter(field.key, option.value)}
                        variant={filters[field.key] === option.value ? "primary" : "secondary"}
                        style={styles.filterButton}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </AppCard>
          ) : null}
          {filteredRecords.length === 0 ? (
            <View style={styles.stateWrapper}>
              <StatePanel title="No matching records" message="Adjust the filters to see more records." variant="empty" />
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
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
        </>
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
  filterCard: {
    gap: 8,
    padding: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  resultCount: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
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
