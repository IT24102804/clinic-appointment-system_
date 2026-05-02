import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';

type Patient = {
  _id?: string;
  NIC?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  additionalAddresses?: { _id?: string; label?: 'home' | 'work' | 'other'; line: string }[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string } | null;
};

export default function PatientProfileScreen() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [draft, setDraft] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const normalizePhone10 = (value: string) => String(value || '').replace(/\D/g, '');
  const isValidPhone10 = (value: string) => /^\d{10}$/.test(normalizePhone10(value));

  const loadProfile = async () => {
    const response = await api.get('/api/patients/me');
    const data = response.data?.data as Patient;
    setPatient(data);
    setDraft({
      phone: data?.phone || '',
      gender: data?.gender || 'Male',
      address: data?.address || '',
      additionalAddresses: Array.isArray(data?.additionalAddresses)
        ? data.additionalAddresses.map((item) => ({
            _id: item._id,
            label: item.label || 'other',
            line: item.line || '',
          }))
        : [],
      emergencyContact: data?.emergencyContact
        ? { ...data.emergencyContact }
        : null,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await loadProfile();
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateDraft = (patch: Partial<Patient>) => {
    setDraft((c) => ({ ...(c || {}), ...patch }));
    setFieldErrors((e) => ({ ...e, _form: null }));
  };

  const handleCancel = () => {
    if (!patient) return;
    setFieldErrors({});
    setShowAdvanced(false);
    setDraft({
      phone: patient.phone || '',
      gender: patient.gender || 'Male',
      address: patient.address || '',
      additionalAddresses: Array.isArray(patient.additionalAddresses)
        ? patient.additionalAddresses.map((item) => ({
            _id: item._id,
            label: item.label || 'other',
            line: item.line || '',
          }))
        : [],
      emergencyContact: patient.emergencyContact ? { ...patient.emergencyContact } : null,
    });
  };

  const emergencyValid = useMemo(() => {
    const c = draft?.emergencyContact;
    if (!c) return { present: false, complete: true };
    const name = String(c.name || '').trim();
    const phone = String(c.phone || '').trim();
    const relationship = String(c.relationship || '').trim();
    return { present: true, complete: !!(name && phone && relationship) };
  }, [draft?.emergencyContact]);

  const handleUpdate = async () => {
    if (!draft || busy) return;
    const nextErrors: Record<string, any> = {};
    if (!String(draft.phone || '').trim()) {
      nextErrors.phone = 'Phone is required.';
    } else if (!isValidPhone10(String(draft.phone || ''))) {
      nextErrors.phone = 'Phone must be exactly 10 digits.';
    }
    if (!String(draft.address || '').trim()) nextErrors.address = 'Address is required.';

    const additional = (draft.additionalAddresses || []).filter(Boolean);
    const additionalErrors = additional.map((a) =>
      !String(a.line || '').trim() ? 'Address line cannot be blank.' : null,
    );
    if (additionalErrors.some(Boolean)) nextErrors.additionalAddresses = additionalErrors;

    if (draft.emergencyContact && emergencyValid.present && !emergencyValid.complete) {
      const c = draft.emergencyContact;
      nextErrors.emergencyContact = {
        name: !String(c?.name || '').trim() ? 'Name is required.' : null,
        phone: !String(c?.phone || '').trim() ? 'Phone is required.' : null,
        relationship: !String(c?.relationship || '').trim() ? 'Relationship is required.' : null,
      };
    }

    if (draft.emergencyContact && emergencyValid.complete) {
      const raw = String(draft.emergencyContact.phone || '');
      if (!isValidPhone10(raw)) {
        nextErrors.emergencyContact = {
          ...(nextErrors.emergencyContact || {}),
          phone: 'Phone must be exactly 10 digits.',
        };
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setShowAdvanced(true);
      return;
    }

    const payload: any = {
      phone: normalizePhone10(String(draft.phone)),
      gender: draft.gender,
      address: String(draft.address).trim(),
      additionalAddresses: additional.map((a) => ({
        _id: a._id,
        label: a.label,
        line: String(a.line).trim(),
      })),
    };
    payload.emergencyContact =
      draft.emergencyContact && emergencyValid.complete
        ? {
            name: String(draft.emergencyContact.name || '').trim(),
            phone: normalizePhone10(String(draft.emergencyContact.phone || '')),
            relationship: String(draft.emergencyContact.relationship || '').trim(),
          }
        : null;

    try {
      setBusy(true);
      setFieldErrors({});
      await api.patch('/api/patients/me', payload);
      await loadProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (Array.isArray(e?.response?.data?.errors)
          ? e.response.data.errors.map((x: any) => `${x.field}: ${x.message}`).join('\n')
          : null) ||
        e?.message ||
        'Unable to update profile';
      setFieldErrors({ _form: msg });
      Alert.alert('Update Failed', msg);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Read-only identity */}
      <FormRow label="First Name" value={user?.firstName} />
      <FormRow label="Last Name" value={user?.lastName} />
      <FormRow label="Email" value={user?.email} />
      <FormRow label="NIC" value={patient?.NIC} />
      <FormRow
        label="Date of Birth"
        value={patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
      />

      {/* Editable */}
      <FormRow label="Mobile">
        <TextInput
          style={styles.input}
          value={draft?.phone ?? ''}
          onChangeText={(t) => {
            updateDraft({ phone: t });
            setFieldErrors((e) => ({ ...e, phone: null }));
          }}
          editable={!busy}
          keyboardType="phone-pad"
          placeholder="07XXXXXXXX"
          placeholderTextColor="#94a3b8"
        />
        {fieldErrors?.phone ? <Text style={styles.fieldError}>{String(fieldErrors.phone)}</Text> : null}
      </FormRow>

      <FormRow label="Gender">
        <View style={styles.chips}>
          {(['Male', 'Female', 'Other'] as const).map((g) => {
            const selected = draft?.gender === g;
            return (
              <Pressable
                key={g}
                disabled={busy}
                onPress={() => updateDraft({ gender: g })}
                style={[styles.chip, selected ? styles.chipActive : null]}>
                <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{g}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormRow>

      <FormRow label="Address">
        <TextInput
          style={styles.input}
          value={draft?.address ?? ''}
          onChangeText={(t) => {
            updateDraft({ address: t });
            setFieldErrors((e) => ({ ...e, address: null }));
          }}
          editable={!busy}
          placeholder="Address"
          placeholderTextColor="#94a3b8"
        />
        {fieldErrors?.address ? <Text style={styles.fieldError}>{String(fieldErrors.address)}</Text> : null}
      </FormRow>

      {/* Advanced (additional addresses + emergency contact) */}
      <Pressable onPress={() => setShowAdvanced((s) => !s)} style={styles.advancedToggle}>
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? '▾' : '▸'} Additional addresses & emergency contact
        </Text>
      </Pressable>

      {showAdvanced ? (
        <View style={styles.advancedBlock}>
          <Text style={styles.subTitle}>Additional Addresses</Text>
          {(draft?.additionalAddresses || []).length === 0 ? (
            <Text style={styles.muted}>None.</Text>
          ) : null}
          {(draft?.additionalAddresses || []).map((item, index) => (
            <View key={item._id || `new-${index}`} style={styles.subCard}>
              <View style={styles.chips}>
                {(['home', 'work', 'other'] as const).map((label) => {
                  const selected = item.label === label;
                  return (
                    <Pressable
                      key={label}
                      disabled={busy}
                      onPress={() =>
                        updateDraft({
                          additionalAddresses: (draft?.additionalAddresses || []).map((x, i) =>
                            i === index ? { ...x, label } : x,
                          ),
                        })
                      }
                      style={[styles.chipSm, selected ? styles.chipActive : null]}>
                      <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={item.line}
                editable={!busy}
                placeholder="Address line"
                placeholderTextColor="#94a3b8"
                onChangeText={(t) =>
                  updateDraft({
                    additionalAddresses: (draft?.additionalAddresses || []).map((x, i) =>
                      i === index ? { ...x, line: t } : x,
                    ),
                  })
                }
              />
              {Array.isArray(fieldErrors?.additionalAddresses) && fieldErrors.additionalAddresses[index] ? (
                <Text style={styles.fieldError}>{String(fieldErrors.additionalAddresses[index])}</Text>
              ) : null}
              <Pressable
                disabled={busy}
                onPress={async () => {
                  if (item._id) {
                    try {
                      setBusy(true);
                      await api.delete(`/api/patients/me/additional-addresses/${item._id}`);
                      await loadProfile();
                    } catch (e: any) {
                      Alert.alert('Delete Failed', e?.response?.data?.message || 'Unable to delete');
                    } finally {
                      setBusy(false);
                    }
                  } else {
                    updateDraft({
                      additionalAddresses: (draft?.additionalAddresses || []).filter((_, i) => i !== index),
                    });
                  }
                }}
                style={styles.removeLink}>
                <Text style={styles.removeLinkText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          {(draft?.additionalAddresses || []).length < 3 ? (
            <Pressable
              disabled={busy}
              onPress={() => {
                const list = draft?.additionalAddresses || [];
                if (list.length > 0 && !String(list[list.length - 1].line || '').trim()) {
                  Alert.alert('Validation', 'Fill the previous address before adding a new one.');
                  return;
                }
                updateDraft({
                  additionalAddresses: [...list, { label: 'other', line: '' }],
                });
              }}
              style={styles.linkRow}>
              <Text style={styles.linkRowText}>+ Add additional address</Text>
            </Pressable>
          ) : null}

          <Text style={[styles.subTitle, { marginTop: 18 }]}>Emergency Contact</Text>
          {!draft?.emergencyContact ? (
            <Pressable
              disabled={busy}
              onPress={() =>
                updateDraft({ emergencyContact: { name: '', phone: '', relationship: '' } })
              }
              style={styles.linkRow}>
              <Text style={styles.linkRowText}>+ Add emergency contact</Text>
            </Pressable>
          ) : (
            <View style={styles.subCard}>
              <Text style={styles.subLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={draft.emergencyContact.name || ''}
                editable={!busy}
                onChangeText={(t) =>
                  updateDraft({ emergencyContact: { ...draft.emergencyContact!, name: t } })
                }
              />
              {fieldErrors?.emergencyContact?.name ? (
                <Text style={styles.fieldError}>{String(fieldErrors.emergencyContact.name)}</Text>
              ) : null}
              <Text style={styles.subLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={draft.emergencyContact.phone || ''}
                editable={!busy}
                keyboardType="phone-pad"
                onChangeText={(t) =>
                  updateDraft({ emergencyContact: { ...draft.emergencyContact!, phone: t } })
                }
              />
              {fieldErrors?.emergencyContact?.phone ? (
                <Text style={styles.fieldError}>{String(fieldErrors.emergencyContact.phone)}</Text>
              ) : null}
              <Text style={styles.subLabel}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={draft.emergencyContact.relationship || ''}
                editable={!busy}
                onChangeText={(t) =>
                  updateDraft({ emergencyContact: { ...draft.emergencyContact!, relationship: t } })
                }
              />
              {fieldErrors?.emergencyContact?.relationship ? (
                <Text style={styles.fieldError}>{String(fieldErrors.emergencyContact.relationship)}</Text>
              ) : null}
              <Pressable
                disabled={busy}
                onPress={() => updateDraft({ emergencyContact: null })}
                style={styles.removeLink}>
                <Text style={styles.removeLinkText}>Remove emergency contact</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {fieldErrors?._form ? <Text style={styles.formError}>{String(fieldErrors._form)}</Text> : null}

      <Pressable onPress={() => setShowPasswordModal(true)} style={styles.changePasswordLink}>
        <Text style={styles.changePasswordText}>Change password</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          disabled={busy}
          onPress={handleCancel}
          style={[styles.btn, styles.btnSecondary, busy ? styles.disabled : null]}>
          <Text style={styles.btnSecondaryText}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={handleUpdate}
          style={[styles.btn, styles.btnPrimary, busy ? styles.disabled : null]}>
          <Text style={styles.btnPrimaryText}>{busy ? 'Updating...' : 'Update'}</Text>
        </Pressable>
      </View>

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </ScrollView>
  );
}

function FormRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowField}>
        {children ? children : <Text style={styles.rowValue}>{value || '-'}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#64748b' },
  error: { color: '#b91c1c' },
  formError: { color: '#b91c1c', marginTop: 10, fontWeight: '700' },
  fieldError: { color: '#b91c1c', marginTop: 4, fontSize: 12, fontWeight: '700' },

  avatarWrap: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#475569', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLabel: { width: 110, color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  rowField: { flex: 1 },
  rowValue: { color: '#0f172a', fontSize: 15 },
  input: {
    color: '#0f172a',
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  chipSm: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  chipActive: { borderColor: '#dc2626', backgroundColor: '#fee2e2' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  chipTextActive: { color: '#b91c1c' },

  advancedToggle: { marginTop: 16, paddingVertical: 8 },
  advancedToggleText: { color: '#1d4ed8', fontWeight: '700' },
  advancedBlock: { marginTop: 4 },
  subTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 6, marginBottom: 6 },
  subCard: { marginTop: 8, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, gap: 6, backgroundColor: '#f8fafc' },
  subLabel: { fontSize: 11, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginTop: 6, letterSpacing: 0.5 },
  removeLink: { marginTop: 8, alignSelf: 'flex-end' },
  removeLinkText: { color: '#b91c1c', fontWeight: '700' },
  linkRow: { paddingVertical: 10 },
  linkRowText: { color: '#1d4ed8', fontWeight: '700' },

  changePasswordLink: { alignSelf: 'center', marginTop: 18, paddingVertical: 8 },
  changePasswordText: { color: '#dc2626', fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#dc2626' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnSecondary: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  btnSecondaryText: { color: '#0f172a', fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
