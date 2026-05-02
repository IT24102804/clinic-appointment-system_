import { Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

// Patient view is the existing patient profile screen — reused as a component.
import PatientProfileView from '../(tabs)/profile';
import DoctorProfileView from '../../components/profile/DoctorProfileView';
import AdminProfileView from '../../components/profile/AdminProfileView';

// Single role-aware profile route. All roles navigate here; the right view renders
// based on the logged-in user's role. No more duplicated profile screens.
export default function ProfileScreen() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect href={'/(auth)/login' as any} />;

  if (user.role === 'doctor') return <DoctorProfileView />;
  if (user.role === 'admin') return <AdminProfileView />;
  return <PatientProfileView />;
}
