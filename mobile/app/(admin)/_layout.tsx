import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href={'/(auth)/login' as any} />;
  if (user.role !== 'admin') return <Redirect href={'/(patient)' as any} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
