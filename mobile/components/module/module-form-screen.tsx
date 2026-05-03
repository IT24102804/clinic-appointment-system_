import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
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

function recordToForm(config: ModuleConfig, record: CrudRecord) {
  return config.fields.reduce<Record<string, string>>((values, field) => {
    const rawValue = record[field.key];
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
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasToken = Boolean(getAuthToken());

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    const referenceKeys = Array.from(
      new Set(config.fields.map((field) => field.reference).filter(Boolean))
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
  }, [config.fields]);

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

          if (patientId && config.fields.some((field) => field.key === "patientId")) {
            next.patientId = patientId;
          }

          if (doctorId && config.fields.some((field) => field.key === "doctorId")) {
            next.doctorId = doctorId;
          }

          const sessionFee = getDoctorSessionFee(selectedAppointment);

          if (
            sessionFee !== undefined &&
            config.fields.some((field) => field.key === "amount")
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
      return (
        <View style={styles.datePickerGroup}>
          <Text style={styles.referenceNote}>{form[field.key] ? formatDate(form[field.key]) : "No date selected"}</Text>
          <AppButton label="Pick date" variant="secondary" onPress={() => setDatePickerField(field.key)} />
          {datePickerField === field.key ? (
            <DateTimePicker
              value={toDateValue(form[field.key] ?? "")}
              mode="date"
              display="default"
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

      return (
        <View style={styles.referenceList}>
          {options.map((option) => {
            const selected = form[field.key] === option._id;
            const label =
              field.reference === "appointments"
                ? formatAppointmentOption(option)
                : formatRef(option);

            return (
              <AppButton
                key={option._id}
                label={label || option._id}
                onPress={() => updateField(field.key, option._id)}
                variant={selected ? "primary" : "secondary"}
              />
            );
          })}
          {form[field.key] ? <Text style={styles.referenceNote}>Selected ID: {form[field.key]}</Text> : null}
        </View>
      );
    }

    return (
      <AppInput
        value={form[field.key] ?? ""}
        onChangeText={(value) => updateField(field.key, value)}
        placeholder={field.placeholder || field.label}
        keyboardType={field.type === "number" ? "numeric" : "default"}
        multiline={field.type === "multiline"}
        autoCapitalize="none"
        editable={!field.readOnly}
      />
    );
  }

  async function submit() {
    const missingField = config.fields.find((field) => field.required && !form[field.key]?.trim());

    if (missingField) {
      setError(`${missingField.label} is required.`);
      return;
    }

    const payload = config.fields.reduce<Record<string, unknown>>((values, field) => {
      values[field.key] = coerceValue(field, form[field.key]?.trim() ?? "");
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
        {config.fields.map((field) => (
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
