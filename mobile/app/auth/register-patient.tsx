import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { PatientRegisterPayload } from "@/services/auth";
import { formatDate } from "@/utils/format-record";

const genderOptions: PatientRegisterPayload["gender"][] = ["female", "male", "other"];
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIC_PATTERN = /^([0-9]{9}[VXvx]|[0-9]{12})$/;
const PHONE_PATTERN = /^(?:\+94|0)[0-9]{9}$/;

function toDatePayload(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function PatientRegisterScreen() {
  const router = useRouter();
  const { registerPatient } = useAuthSession();
  const [form, setForm] = useState<PatientRegisterPayload>({
    fullName: "",
    email: "",
    password: "",
    gender: "female",
    phone: "",
    nic: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<Key extends keyof PatientRegisterPayload>(key: Key, value: PatientRegisterPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function getAge(dateValue: string) {
    const birthDate = new Date(dateValue);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }

  function validateForm() {
    const email = form.email.trim();
    const phone = form.phone.trim();
    const nic = form.nic.trim();
    const age = getAge(form.dateOfBirth);

    if (!form.fullName.trim() || !email || !form.password || !confirmPassword || !phone || !nic || !form.dateOfBirth || !form.address.trim()) {
      return "Full name, email, password, confirm password, phone, NIC, date of birth, and address are required.";
    }

    if (!EMAIL_PATTERN.test(email)) {
      return "Enter a valid email address.";
    }

    if (!STRONG_PASSWORD_PATTERN.test(form.password)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    }

    if (form.password !== confirmPassword) {
      return "Password and confirm password must match.";
    }

    if (!PHONE_PATTERN.test(phone)) {
      return "Phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678.";
    }

    if (!NIC_PATTERN.test(nic)) {
      return "NIC must be valid, for example 961234567V or 199612345678.";
    }

    if (age === null || age < 16) {
      return "Patient must be 16 years old or above.";
    }

    return null;
  }

  function updateEmergencyField(key: "name" | "phone" | "relationship", value: string) {
    setForm((current) => ({
      ...current,
      emergencyContact: {
        ...(current.emergencyContact || {}),
        [key]: value,
      },
    }));
  }

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateField("dateOfBirth", toDatePayload(selectedDate));
  }

  async function submit() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await registerPatient(form);
      router.replace("/patient/home");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to register patient.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader eyebrow="Patient access" title="Register as patient" subtitle="Create your account and clinic patient profile." />

      <AppCard style={styles.card}>
        <AppInput value={form.fullName} onChangeText={(value) => updateField("fullName", value)} placeholder="Full name" />
        <AppInput value={form.email} onChangeText={(value) => updateField("email", value)} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <AppInput value={form.password} onChangeText={(value) => updateField("password", value)} placeholder="Password" secureTextEntry />
        <AppInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" secureTextEntry />
        <AppInput value={form.phone} onChangeText={(value) => updateField("phone", value)} placeholder="Phone" keyboardType="phone-pad" />
        <AppInput value={form.nic} onChangeText={(value) => updateField("nic", value)} placeholder="NIC" autoCapitalize="characters" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.options}>
          {genderOptions.map((gender) => (
            <AppButton
              key={gender}
              label={gender.toUpperCase()}
              onPress={() => updateField("gender", gender)}
              variant={form.gender === gender ? "primary" : "secondary"}
              style={styles.optionButton}
            />
          ))}
        </View>

        <Text style={styles.label}>Date of birth</Text>
        <Text style={styles.helperText}>{form.dateOfBirth ? formatDate(form.dateOfBirth) : "No date selected"}</Text>
        <AppButton label="Pick date of birth" variant="secondary" onPress={() => setShowDatePicker(true)} />
        {showDatePicker ? (
          <DateTimePicker value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()} mode="date" display="default" onChange={handleDateChange} />
        ) : null}

        <AppInput value={form.address} onChangeText={(value) => updateField("address", value)} placeholder="Address" multiline />

        <Text style={styles.label}>Emergency contact</Text>
        <AppInput value={form.emergencyContact?.name || ""} onChangeText={(value) => updateEmergencyField("name", value)} placeholder="Emergency contact name" />
        <AppInput
          value={form.emergencyContact?.phone || ""}
          onChangeText={(value) => updateEmergencyField("phone", value)}
          placeholder="Emergency contact phone"
          keyboardType="phone-pad"
        />
        <AppInput
          value={form.emergencyContact?.relationship || ""}
          onChangeText={(value) => updateEmergencyField("relationship", value)}
          placeholder="Relationship"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <AppButton label="Create patient account" onPress={() => void submit()} busy={busy} />
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
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
  helperText: {
    color: AppColors.textMuted,
    fontSize: 13,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
