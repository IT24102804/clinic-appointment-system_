import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const DateTimePickerModuleName = '@react-native-community/datetimepicker';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NativeDateTimePicker: any = Platform.OS === 'web'
  ? null
  : (require(DateTimePickerModuleName).default as any);

export default function RegisterScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    phone: '', NIC: '', dateOfBirth: '', gender: '', address: ''
  });
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register } = useAuth();

  const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    NIC: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  };

  const minimumDob = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 16);
    return date;
  }, []);

  const maximumDobString = useMemo(() => {
    return minimumDob.toISOString().slice(0, 10);
  }, [minimumDob]);

  const selectedDobDate = useMemo(() => {
    const raw = String(form.dateOfBirth || '').trim();
    if (!raw) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }, [form.dateOfBirth]);

  const formatDateOnly = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  const normalizedGender = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) {
      return cleaned;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  const normalizeNic = (value: string) => value.trim().toUpperCase();

  const normalizePhone10 = (value: string) => String(value || '').replace(/\D/g, '');
  const isValidPhone10 = (value: string) => /^\d{10}$/.test(normalizePhone10(value));

  const isValidNic = (value: string) => {
    const cleaned = normalizeNic(value);
    return /^(\d{9}[VX]|\d{12})$/.test(cleaned);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (!PASSWORD_REGEX.test(form.password)) {
      nextErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required.';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone is required.';
    } else if (!isValidPhone10(form.phone)) {
      nextErrors.phone = 'Phone must be exactly 10 digits.';
    }
    if (!form.NIC.trim()) {
      nextErrors.NIC = 'NIC is required.';
    } else if (!isValidNic(form.NIC)) {
      nextErrors.NIC = 'NIC must be 9 digits followed by V/X, or 12 digits.';
    }
    if (!form.address.trim()) nextErrors.address = 'Address is required.';

    const normalized = normalizedGender(form.gender);
    if (!normalized) {
      nextErrors.gender = 'Gender is required.';
    } else if (!['Male', 'Female', 'Other'].includes(normalized)) {
      nextErrors.gender = 'Gender must be Male, Female, or Other.';
    }

    if (!form.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = 'Date of birth is required.';
    } else {
      const parsed = new Date(form.dateOfBirth);
      if (Number.isNaN(parsed.getTime())) {
        nextErrors.dateOfBirth = 'Date of birth must be a valid date (YYYY-MM-DD).';
      } else if (parsed > minimumDob) {
        nextErrors.dateOfBirth = 'You must be at least 16 years old.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (submitting) return;
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage(null);
      await register({
        ...form,
        NIC: normalizeNic(form.NIC),
        gender: normalizedGender(form.gender),
        phone: normalizePhone10(form.phone),
      });
      setForm({ ...emptyForm });
      setFieldErrors({});
      setShowDobPicker(false);
      setSuccessMessage('Account created successfully. Please login.');
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      const goToLanding = () => {
        if (Platform.OS === 'web') {
          try {
            const w = (globalThis as any)?.window;
            if (w?.location?.assign) {
              w.location.assign('/');
              return;
            }
          } catch (e) {
            // ignore
          }
        }

        try {
          (router as any).dismissAll?.();
        } catch (e) {
          // ignore
        }

        try {
          router.replace('/' as any);
          return;
        } catch (e) {
          // ignore
        }

        try {
          router.push('/' as any);
        } catch (e) {
          // ignore
        }
      };

      if (Platform.OS === 'web') {
        setTimeout(goToLanding, 50);
      } else {
        Alert.alert('Success', 'Account created successfully. Please login from the home screen.');
        setTimeout(goToLanding, 50);
      }
    } catch (error: any) {
      setSuccessMessage(null);
      const status = error?.response?.status;
      const apiMessage = error?.response?.data?.message;
      if (status === 409 && typeof apiMessage === 'string') {
        const lower = apiMessage.toLowerCase();
        if (lower.includes('email')) {
          setFieldErrors((current) => ({ ...current, email: apiMessage }));
        } else if (lower.includes('nic')) {
          setFieldErrors((current) => ({ ...current, NIC: apiMessage }));
        } else if (lower.includes('phone')) {
          setFieldErrors((current) => ({ ...current, phone: apiMessage }));
        }
      }

      const message =
        apiMessage ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item: any) => `${item.field}: ${item.message}`).join('\n')
          : null) ||
        error?.message ||
        'Registration failed';

      Alert.alert('Registration Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        <TextInput style={styles.input} placeholder="First Name" value={form.firstName} onChangeText={text => setForm({...form, firstName: text})} />
        {fieldErrors.firstName ? <Text style={styles.errorText}>{fieldErrors.firstName}</Text> : null}
      <TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={text => setForm({...form, lastName: text})} />
      {fieldErrors.lastName ? <Text style={styles.errorText}>{fieldErrors.lastName}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email (name@example.com)"
        value={form.email}
        onChangeText={text => setForm({...form, email: text})}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={text => setForm({...form, password: text})} />
      <PasswordRules value={form.password} />
      {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={form.confirmPassword} onChangeText={text => setForm({...form, confirmPassword: text})} />
      {fieldErrors.confirmPassword ? <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text> : null}
      <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={text => setForm({...form, phone: text})} keyboardType="phone-pad" />
      {fieldErrors.phone ? <Text style={styles.errorText}>{fieldErrors.phone}</Text> : null}
      <TextInput style={styles.input} placeholder="NIC" value={form.NIC} onChangeText={text => setForm({...form, NIC: text})} />
      {fieldErrors.NIC ? <Text style={styles.errorText}>{fieldErrors.NIC}</Text> : null}

      <Text style={styles.fieldLabel}>Date of Birth</Text>
      {Platform.OS === 'web' ? (
        <View style={styles.webDateWrap}>
          {React.createElement('input', {
            value: form.dateOfBirth,
            type: 'date',
            max: maximumDobString,
            onChange: (e: any) => setForm({ ...form, dateOfBirth: String(e?.target?.value || '') }),
            style: {
              width: '100%',
              minHeight: 22,
              padding: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              color: '#0f172a',
              WebkitAppearance: 'auto',
            },
          })}
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => setShowDobPicker(true)}
            style={StyleSheet.flatten([styles.input, styles.datePressable])}>
            <Text style={styles.dateText}>
              {form.dateOfBirth ? form.dateOfBirth : 'Select date of birth'}
            </Text>
          </Pressable>

          {showDobPicker ? (
            <NativeDateTimePicker
              value={selectedDobDate || minimumDob}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={minimumDob}
              onChange={(event: any, date?: Date) => {
                if (Platform.OS !== 'ios') {
                  setShowDobPicker(false);
                }

                if (event.type === 'dismissed') {
                  return;
                }

                if (!date) {
                  return;
                }

                setForm((current) => ({
                  ...current,
                  dateOfBirth: formatDateOnly(date),
                }));
              }}
            />
          ) : null}

          {Platform.OS === 'ios' && showDobPicker ? (
            <Pressable
              onPress={() => setShowDobPicker(false)}
              style={StyleSheet.flatten([styles.smallInlineButton, styles.smallInlineButtonDone])}>
              <Text style={styles.smallInlineButtonText}>Done</Text>
            </Pressable>
          ) : null}
        </>
      )}
      {fieldErrors.dateOfBirth ? <Text style={styles.errorText}>{fieldErrors.dateOfBirth}</Text> : null}

      <View style={styles.genderBlock}>
        <Text style={styles.genderLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {(['Male', 'Female', 'Other'] as const).map((option) => {
            const selected = normalizedGender(form.gender) === option;
            return (
              <Pressable
                key={option}
                onPress={() => setForm({ ...form, gender: option })}
                style={StyleSheet.flatten([styles.genderOption, selected ? styles.genderOptionSelected : null])}>
                <View style={StyleSheet.flatten([styles.genderRadio, selected ? styles.genderRadioSelected : null])} />
                <Text style={styles.genderText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.gender ? <Text style={styles.errorText}>{fieldErrors.gender}</Text> : null}
      </View>
      <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={text => setForm({...form, address: text})} />
      {fieldErrors.address ? <Text style={styles.errorText}>{fieldErrors.address}</Text> : null}
      <TouchableOpacity
        style={StyleSheet.flatten([styles.button, submitting ? styles.buttonDisabled : null])}
        onPress={handleRegister}
        disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>
      <Pressable onPress={() => router.push('/' as any)}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </Pressable>
    </ScrollView>
  </KeyboardAvoidingView>
);

}

function PasswordRules({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(value), label: 'One uppercase letter' },
    { ok: /[a-z]/.test(value), label: 'One lowercase letter' },
    { ok: /\d/.test(value), label: 'One number' },
    { ok: /[^A-Za-z0-9]/.test(value), label: 'One special character' },
  ];
  return (
    <View style={styles.rulesBox}>
      {rules.map((r) => (
        <View key={r.label} style={styles.ruleRow}>
          <Text style={[styles.ruleIcon, r.ok ? styles.ruleOk : styles.ruleBad]}>{r.ok ? '✓' : '○'}</Text>
          <Text style={[styles.ruleText, r.ok ? styles.ruleOk : styles.ruleBad]}>{r.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  successText: { marginBottom: 12, color: '#0f6e56', fontWeight: '700', textAlign: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12, marginBottom: 8, fontSize: 16 },
  webDateWrap: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#fff' },
  datePressable: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: '#0f172a' },
  smallInlineButton: { marginBottom: 8, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  smallInlineButtonDone: { backgroundColor: '#006b5a' },
  smallInlineButtonText: { color: '#fff', fontWeight: '800' },
  errorText: { marginBottom: 12, color: '#a92b1f' },
  genderBlock: { marginBottom: 12 },
  genderLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  genderOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
  genderOptionSelected: { borderColor: '#006b5a', backgroundColor: '#e1f5ee' },
  genderRadio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#64748B', marginRight: 8 },
  genderRadioSelected: { borderColor: '#006b5a', backgroundColor: '#006b5a' },
  genderText: { fontSize: 14 },
  button: { backgroundColor: '#006b5a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkText: { marginTop: 20, textAlign: 'center', color: '#006b5a' },
  rulesBox: { marginBottom: 10, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, gap: 2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleIcon: { width: 18, textAlign: 'center' },
  ruleText: { fontSize: 12 },
  ruleOk: { color: '#15803d' },
  ruleBad: { color: '#94a3b8' },
});
