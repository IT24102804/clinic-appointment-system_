import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import api from '../../services/api';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({ visible, onClose }: Props) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNewPwd] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ current?: string | null; new?: string | null; confirm?: string | null; form?: string | null }>({});

  const reset = () => {
    setCurrent('');
    setNewPwd('');
    setConfirm('');
    setErrors({});
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (busy) return;

    const nextErrors: { current?: string | null; new?: string | null; confirm?: string | null; form?: string | null } = {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      if (!currentPassword) nextErrors.current = 'Current password is required.';
      if (!newPassword) nextErrors.new = 'New password is required.';
      if (!confirmPassword) nextErrors.confirm = 'Confirm password is required.';
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirm = 'Confirmation does not match.';
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      nextErrors.new =
        'Must be 8+ chars with uppercase, lowercase, number, and special character.';
    }
    if (currentPassword === newPassword) {
      nextErrors.new = 'New password must differ from current password.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setBusy(true);
      setErrors({});
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password updated successfully');
      reset();
      onClose();
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      const validatorMsg = Array.isArray(e?.response?.data?.errors)
        ? e.response.data.errors.map((x: any) => x.message).join('\n')
        : null;
      const msg = serverMsg || validatorMsg || e?.message || 'Unable to change password';

      if (status === 401 && typeof serverMsg === 'string' && /current password/i.test(serverMsg)) {
        setErrors({ current: serverMsg });
        return;
      }

      if (status === 400 && typeof serverMsg === 'string' && /differ/i.test(serverMsg)) {
        setErrors({ new: serverMsg });
        return;
      }

      setErrors({ form: msg });
      Alert.alert('Change Password Failed', msg);
    } finally {
      setBusy(false);
    }
  };

  const rules = [
    { ok: newPassword.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
    { ok: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
    { ok: /\d/.test(newPassword), label: 'One number' },
    { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'One special character' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Change Password</Text>

          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={(t) => {
              setCurrent(t);
              setErrors((e) => ({ ...e, current: null, form: null }));
            }}
            secureTextEntry
            editable={!busy}
            autoCapitalize="none"
          />
          {errors?.current ? <Text style={styles.errorText}>{String(errors.current)}</Text> : null}

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={(t) => {
              setNewPwd(t);
              setErrors((e) => ({ ...e, new: null, form: null }));
            }}
            secureTextEntry
            editable={!busy}
            autoCapitalize="none"
          />
          {errors?.new ? <Text style={styles.errorText}>{String(errors.new)}</Text> : null}

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirm(t);
              setErrors((e) => ({ ...e, confirm: null, form: null }));
            }}
            secureTextEntry
            editable={!busy}
            autoCapitalize="none"
          />
          {errors?.confirm ? <Text style={styles.errorText}>{String(errors.confirm)}</Text> : null}

          <View style={styles.rules}>
            {rules.map((r) => (
              <Text key={r.label} style={[styles.rule, r.ok ? styles.ruleOk : styles.ruleBad]}>
                {r.ok ? '✓' : '○'}  {r.label}
              </Text>
            ))}
          </View>

          {errors?.form ? <Text style={styles.formErrorText}>{String(errors.form)}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={close}
              style={[styles.btn, styles.btnSecondary, busy ? styles.disabled : null]}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={submit}
              style={[styles.btn, styles.btnPrimary, busy ? styles.disabled : null]}>
              <Text style={styles.btnPrimaryText}>{busy ? 'Updating...' : 'Update'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '700', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, marginTop: 4, fontSize: 15, color: '#0f172a', backgroundColor: '#fff' },
  errorText: { color: '#b91c1c', marginTop: 6, fontSize: 12, fontWeight: '700' },
  rules: { marginTop: 12, padding: 10, backgroundColor: '#f8fafc', borderRadius: 10, gap: 4 },
  rule: { fontSize: 13 },
  ruleOk: { color: '#15803d' },
  ruleBad: { color: '#94a3b8' },
  formErrorText: { color: '#b91c1c', marginTop: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#dc2626' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnSecondary: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  btnSecondaryText: { color: '#0f172a', fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
