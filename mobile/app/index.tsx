import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LankaDOC360</Text>
      <Text style={styles.subtitle}>Your trusted clinic partner</Text>
      
      <Link href={'/(auth)/login' as any} asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>
      </Link>
      
      <Link href={'/(auth)/register' as any} asChild>
        <Pressable style={StyleSheet.flatten([styles.button, styles.outlineButton])}>
          <Text style={styles.outlineButtonText}>Register as Patient</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#006b5a' },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 40 },
  button: { width: '100%', backgroundColor: '#006b5a', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#006b5a' },
  outlineButtonText: { color: '#006b5a', fontWeight: 'bold' },
});