import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { AppColors } from '@/constants/design';

export default function PatientHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.firstName} {user?.lastName}!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Upcoming Appointments Card (placeholder) */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/(patient)/appointments' as any)}>
        <Text style={styles.cardTitle}>📅 Upcoming Appointments</Text>
        <Text style={styles.cardSubtitle}>You have no upcoming appointments</Text>
        <Text style={styles.cardLink}>View all →</Text>
      </TouchableOpacity>

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/placeholders/doctors')}>
          <Text style={styles.quickIcon}>👨‍⚕️</Text>
          <Text style={styles.quickLabel}>Find Doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(patient)/appointments' as any)}>
          <Text style={styles.quickIcon}>📋</Text>
          <Text style={styles.quickLabel}>My Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/placeholders/medical-records')}>
          <Text style={styles.quickIcon}>📁</Text>
          <Text style={styles.quickLabel}>Medical Records</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/placeholders/billing')}>
          <Text style={styles.quickIcon}>💰</Text>
          <Text style={styles.quickLabel}>Billing & Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Doctors Section (placeholder) */}
      <Text style={styles.sectionTitle}>Saved Doctors</Text>
      <TouchableOpacity style={styles.seeAllRow} onPress={() => router.push('/placeholders/doctors')}>
        <Text style={styles.seeAllText}>See all →</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedDoctorsScroll}>
        {[1, 2, 3].map((_, index) => (
          <TouchableOpacity key={index} style={styles.doctorCard}>
            <Text style={styles.doctorIcon}>👨‍⚕️</Text>
            <Text style={styles.doctorName}>Dr. Sample</Text>
            <Text style={styles.doctorSpecialty}>Cardiologist</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Medical Records (placeholder) */}
      <Text style={styles.sectionTitle}>Recent Medical Records</Text>
      <TouchableOpacity style={styles.recordCard} onPress={() => router.push('/placeholders/medical-records')}>
        <Text style={styles.recordName}>Complete Blood Count</Text>
        <Text style={styles.recordDate}>June 1, 2024 • Asiri Hospital</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.recordCard} onPress={() => router.push('/placeholders/medical-records')}>
        <Text style={styles.recordName}>ECG Report</Text>
        <Text style={styles.recordDate}>May 15, 2024 • Nawaloka Clinic</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#006b5a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: AppColors.textMuted,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginBottom: 8,
  },
  cardLink: {
    fontSize: 14,
    color: AppColors.accent,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.text,
    textAlign: 'center',
  },
  seeAllRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.accent,
    fontWeight: '500',
  },
  savedDoctorsScroll: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  doctorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: AppColors.textMuted,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e9f0',
  },
  recordName: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.text,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
});