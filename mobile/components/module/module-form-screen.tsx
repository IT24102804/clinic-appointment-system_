import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getAuthToken } from "@/services/api-client";
import { appointmentService } from "@/services/appointments";
import { doctorService } from "@/services/doctors";
import { patientService } from "@/services/patients";
import { CrudRecord, FieldConfig, ModuleConfig } from "@/types/crud";
import { formatDate, formatRef, formatValue, getRefId } from "@/utils/format-record";

type CrudService<TRecord extends CrudRecord> = {
  get: (id: string) => Promise<TRecord>;
  create: (payload: Record<string, unknown>) => Promise<TRecord>;
  update: (id: string, payload: Record<string, unknown>) => Promise<TRecord>;
};

type ModuleFormScreenProps<TRecord extends CrudRecord> = {
  config: ModuleConfig;
  service: CrudService<TRecord>;
  mode: "create" | "edit";
};

type ReferenceKey = NonNullable<FieldConfig["reference"]>;

const referenceServices = {
  patients: patientService,
  doctors: doctorService,
  appointments: appointmentService,
} satisfies Record<ReferenceKey, { list: () => Promise<CrudRecord[]> }>;

function coerceValue(field: FieldConfig, value: string) {
  if (field.type === "number") {
    return value === "" ? undefined : Number(value);
  }

  return value;
}

function getNestedValue(record: CrudRecord | Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[part];
  }, record);
}

function setNestedValue(target: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split(".");
  let current = target;

  parts.slice(0, -1).forEach((part) => {
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }

    current = current[part] as Record<string, unknown>;
  });

  current[parts[parts.length - 1]] = value;
}

function recordToForm(config: ModuleConfig, record: CrudRecord) {
  return config.fields.reduce<Record<string, string>>((values, field) => {
    const rawValue = getNestedValue(record, field.key);
    values[field.key] = field.type === "reference" ? getRefId(rawValue) : rawValue === undefined || rawValue === null ? "" : String(rawValue);
    return values;
  }, {});
}

function toDateValue(value: string) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDatePayload(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getMinimumAgeDate(minAge: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minAge);
  return date;
}

function toTimeValue(value: string) {
  const date = new Date();
  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    date.setHours(9, 0, 0, 0);
    return date;
  }

  const [, hourText, minuteText, meridiem] = match;
  let hours = Number(hourText);

  if (meridiem.toUpperCase() === "PM" && hours < 12) {
    hours += 12;
  }

  if (meridiem.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  date.setHours(hours, Number(minuteText), 0, 0);
  return date;
}

function toTimePayload(value: Date) {
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isMongoObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function formatAppointmentOption(appointment: CrudRecord) {
  const patient = formatRef(appointment.patientId);
  const doctor = formatRef(appointment.doctorId);
  const date = formatDate(appointment.appointmentDate);
  const time = formatValue(appointment.timeSlot);
  const status = formatValue(appointment.status);

  return `${patient} | ${doctor} | ${date || "No date"} | ${time} | ${status}`;
}

function getDoctorSessionFee(appointment: CrudRecord) {
  const doctor = appointment.doctorId;

  if (doctor && typeof doctor === "object" && "sessionFee" in doctor) {
    return (doctor as { sessionFee?: number }).sessionFee;
  }

  return undefined;
}

export function ModuleFormScreen<TRecord extends CrudRecord>({ config, service, mode }: ModuleFormScreenProps<TRecord>) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [form, setForm] = useState<Record<string, string>>(config.defaultValues);
  const [loading, setLoading] = useState(mode === "edit");
  const [references, setReferences] = useState<Record<ReferenceKey, CrudRecord[]>>({
    patients: [],
    doctors: [],
    appointments: [],
  });
  const [visibleReferenceOptions, setVisibleReferenceOptions] = useState<Record<string, boolean>>({});
  const [referenceSearches, setReferenceSearches] = useState<Record<string, string>>({});
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());
  const visibleFields = useMemo(
    () => config.fields.filter((field) => !field.visibleIn || field.visibleIn.includes(mode)),
    [config.fields, mode]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    const referenceKeys = Array.from(
      new Set(visibleFields.map((field) => field.reference).filter(Boolean))
    ) as ReferenceKey[];

    if (referenceKeys.length === 0) {
      return;
    }

    async function loadReferences() {
      try {
        setReferencesLoading(true);
        const loaded = await Promise.all(referenceKeys.map(async (key) => [key, await referenceServices[key].list()] as const));
        setReferences((current) => ({
          ...current,
          ...Object.fromEntries(loaded),
        }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load selector data.");
      } finally {
        setReferencesLoading(false);
      }
    }

    void loadReferences();
  }, [visibleFields]);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    if (mode !== "edit" || !id) {
      return;
    }

    async function loadRecord() {
      try {
        setLoading(true);
        const record = await service.get(id);
        setForm({ ...config.defaultValues, ...recordToForm(config, record) });
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load record.");
      } finally {
        setLoading(false);
      }
    }

    void loadRecord();
  }, [config, id, mode, service]);

  if (!hasToken) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel
          title="Login required"
          message={`Login with a staff account to ${mode === "edit" ? "edit" : "create"} this record.`}
          actionLabel="Go to login"
          onAction={() => router.push("/auth/login")}
        />
      </AppScreen>
    );
  }

  function updateField(key: string, value: string) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "appointmentId") {
        const selectedAppointment = references.appointments.find((appointment) => appointment._id === value);

        if (selectedAppointment) {
          const patientId = getRefId(selectedAppointment.patientId);
          const doctorId = getRefId(selectedAppointment.doctorId);

          if (patientId && visibleFields.some((field) => field.key === "patientId")) {
            next.patientId = patientId;
          }

          if (doctorId && visibleFields.some((field) => field.key === "doctorId")) {
            next.doctorId = doctorId;
          }

          const sessionFee = getDoctorSessionFee(selectedAppointment);

          if (
            sessionFee !== undefined &&
            visibleFields.some((field) => field.key === "amount")
          ) {
            next.amount = String(sessionFee);
          }
        }
      }

      return next;
    });
  }

  function getReferenceLabel(field: FieldConfig, value: string) {
    if (!field.reference || !value) {
      return "";
    }

    const record = references[field.reference].find((item) => item._id === value);

    if (!record) {
      return value;
    }

    return field.reference === "appointments"
      ? formatAppointmentOption(record)
      : formatRef(record);
  }

  function handleDateChange(field: FieldConfig, event: DateTimePickerEvent, selectedDate?: Date) {
    setDatePickerField(null);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateField(field.key, toDatePayload(selectedDate));
  }

  function handleTimeChange(field: FieldConfig, event: DateTimePickerEvent, selectedDate?: Date) {
    setDatePickerField(null);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateField(field.key, toTimePayload(selectedDate));
  }

  function renderField(field: FieldConfig) {
    if (field.type === "select" && field.options) {
      return (
        <View style={styles.optionRow}>
          {field.options.map((option) => (
            <AppButton
              key={option.value}
              label={option.label}
              onPress={() => updateField(field.key, option.value)}
              variant={form[field.key] === option.value ? "primary" : "secondary"}
              style={styles.optionButton}
            />
          ))}
        </View>
      );
    }

    if (field.type === "date") {
      const maximumDate = config.key === "patients" && field.key === "dateOfBirth" ? getMinimumAgeDate(16) : undefined;

      return (
        <View style={styles.datePickerGroup}>
          <Text style={styles.referenceNote}>{form[field.key] ? formatDate(form[field.key]) : "No date selected"}</Text>
          <AppButton label="Pick date" variant="secondary" onPress={() => setDatePickerField(field.key)} />
          {datePickerField === field.key ? (
            <DateTimePicker
              value={toDateValue(form[field.key] ?? "")}
              mode="date"
              display="default"
              maximumDate={maximumDate}
              onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
            />
          ) : null}
        </View>
      );
    }

    if (field.type === "time") {
      return (
        <View style={styles.datePickerGroup}>
          <Text style={styles.referenceNote}>{form[field.key] || "No time selected"}</Text>
          <AppButton label="Pick time" variant="secondary" onPress={() => setDatePickerField(field.key)} />
          {datePickerField === field.key ? (
            <DateTimePicker
              value={toTimeValue(form[field.key] ?? "")}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => handleTimeChange(field, event, selectedDate)}
            />
          ) : null}
        </View>
      );
    }

    if (field.type === "reference" && field.reference) {
      if (field.readOnly) {
        return (
          <View style={styles.readOnlyReference}>
            <AppInput value={getReferenceLabel(field, form[field.key] ?? "") || "Select appointment first"} editable={false} />
            <Text style={styles.referenceNote}>ID: {form[field.key] || "Not selected"}</Text>
          </View>
        );
      }

      const options = references[field.reference];

      if (referencesLoading) {
        return <Text style={styles.referenceNote}>Loading {field.label.toLowerCase()} options...</Text>;
      }

      if (options.length === 0) {
        return (
          <Text style={styles.referenceNote}>
            No {field.label.toLowerCase()} records found. Create the linked record first, then return to this form.
          </Text>
        );
      }

      const selectedValue = form[field.key] ?? "";
      const showOptions = visibleReferenceOptions[field.key] ?? !selectedValue;
      const searchValue = referenceSearches[field.key] ?? "";
      const optionLabel = (option: CrudRecord) =>
        field.reference === "appointments"
          ? formatAppointmentOption(option)
          : formatRef(option);
      const filteredOptions = options.filter((option) =>
        optionLabel(option).toLowerCase().includes(searchValue.trim().toLowerCase())
      );
      const visibleOptions = searchValue.trim() ? filteredOptions : filteredOptions.slice(0, 8);

      return (
        <>
          {!showOptions && selectedValue ? (
            <AppCard muted style={styles.selectedReferenceCard}>
              <Text style={styles.selectedReferenceLabel}>Selected {field.label.toLowerCase()}</Text>
              <Text style={styles.selectedReferenceText}>{getReferenceLabel(field, selectedValue)}</Text>
              <AppButton
                label={`Change ${field.label.toLowerCase()}`}
                onPress={() =>
                  setVisibleReferenceOptions((current) => ({
                    ...current,
                    [field.key]: true,
                  }))
                }
                variant="secondary"
                style={styles.changeReferenceButton}
              />
            </AppCard>
          ) : null}
          {showOptions ? (
            <View style={styles.referenceList}>
              <AppInput
                value={searchValue}
                onChangeText={(value) =>
                  setReferenceSearches((current) => ({
                    ...current,
                    [field.key]: value,
                  }))
                }
                placeholder={`Search ${field.label.toLowerCase()}`}
                autoCapitalize="none"
              />
              {!searchValue.trim() && filteredOptions.length > visibleOptions.length ? (
                <Text style={styles.referenceNote}>
                  Showing first {visibleOptions.length} records. Search by name, reference, date, or phone to find more.
                </Text>
              ) : null}
              {searchValue.trim() && visibleOptions.length === 0 ? (
                <Text style={styles.referenceNote}>No {field.label.toLowerCase()} records match your search.</Text>
              ) : null}
              {visibleOptions.map((option) => {
                const selected = form[field.key] === option._id;
                const label = optionLabel(option);

                return (
                  <AppButton
                    key={option._id}
                    label={label || option._id}
                    onPress={() => {
                      updateField(field.key, option._id);
                      setVisibleReferenceOptions((current) => ({
                        ...current,
                        [field.key]: false,
                      }));
                      setReferenceSearches((current) => ({
                        ...current,
                        [field.key]: "",
                      }));
                    }}
                    variant={selected ? "primary" : "secondary"}
                  />
                );
              })}
            </View>
          ) : null}
        </>
      );
    }

    return (
      <AppInput
        value={form[field.key] ?? ""}
        onChangeText={(value) => updateField(field.key, value)}
        placeholder={field.placeholder || field.label}
        keyboardType={field.type === "number" ? "numeric" : "default"}
        multiline={field.type === "multiline"}
        secureTextEntry={field.type === "password"}
        autoCapitalize="none"
        editable={!field.readOnly}
      />
    );
  }

  async function submit() {
    const missingField = visibleFields.find((field) => field.required && !form[field.key]?.trim());

    if (missingField) {
      setError(`${missingField.label} is required.`);
      return;
    }

    const malformedReference = visibleFields.find(
      (field) => field.type === "reference" && form[field.key]?.trim() && !isMongoObjectId(form[field.key].trim())
    );

    if (malformedReference) {
      setError(
        `${malformedReference.label} is not a valid database ID. Select a valid linked record again before saving.`
      );
      return;
    }

    const payload = visibleFields.reduce<Record<string, unknown>>((values, field) => {
      const value = coerceValue(field, form[field.key]?.trim() ?? "");

      if (field.key.includes(".")) {
        setNestedValue(values, field.key, value);
        return values;
      }

      values[field.key] = value;
      return values;
    }, {});

    try {
      setSaving(true);
      setError(null);

      if (mode === "edit" && id) {
        await service.update(id, payload);
        router.back();
      } else {
        const created = await service.create(payload);
        router.replace({
          pathname: `${config.basePath}/[id]` as any,
          params: { id: created._id },
        });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save record.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppScreen style={styles.centered}>
        <StatePanel loading message="Loading record..." />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        eyebrow={config.eyebrow}
        title={mode === "edit" ? config.editTitle : config.createTitle}
        subtitle="Fill in the required details and save the record to MongoDB through the API."
      />

      <AppCard style={styles.formCard}>
        {visibleFields.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>{field.label}{field.required ? " *" : ""}</Text>
            {renderField(field)}
          </View>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label={mode === "edit" ? "Save changes" : "Create record"} onPress={() => void submit()} busy={saving} />
      </AppCard>
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
  formCard: {
    gap: 14,
    padding: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerGroup: {
    gap: 8,
  },
  referenceList: {
    gap: 8,
  },
  selectedReferenceCard: {
    gap: 8,
    padding: 14,
  },
  selectedReferenceLabel: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  selectedReferenceText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  changeReferenceButton: {
    marginTop: 4,
    paddingVertical: 11,
  },
  readOnlyReference: {
    gap: 6,
  },
  referenceNote: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
