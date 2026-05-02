import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const role = user.role || 'patient';
    if (role === 'doctor') {
      router.replace('/(doctor)' as any);
      return;
    }
    if (role === 'admin') {
      router.replace('/(admin)' as any);
      return;
    }
    router.replace('/(patient)' as any);
  }, [user]);

  const handleLogin = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      const message = 'Email and password are required';
      setFormError(message);
      Alert.alert('Login Failed', message);
      return;
    }

    try {
      setBusy(true);
      setFormError(null);
      await login(email, password);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((item: any) => `${item.field}: ${item.message}`).join('\n')
          : null) ||
        error?.message ||
        'Invalid credentials';

      setFormError(message);
      Alert.alert('Login Failed', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          style={styles.input}
          placeholder="Email (name@example.com)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={[styles.button, busy ? styles.buttonDisabled : null]} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        <Pressable onPress={() => router.push('/(auth)/register' as any)}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#006b5a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  errorText: { marginTop: 12, textAlign: 'center', color: '#a92b1f', fontSize: 15 },
  link: { marginTop: 20, textAlign: 'center', color: '#006b5a' },
});