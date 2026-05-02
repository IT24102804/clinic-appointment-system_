import api from './api';

export type AdminPatientListItem = {
  _id: string;
  NIC: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  address?: string;
  createdAt?: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: 'active' | 'inactive';
  };
};

export type AdminPatientDetail = {
  _id: string;
  NIC: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  address?: string;
  additionalAddresses?: { _id?: string; label?: string; line: string }[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string } | null;
  createdAt?: string;
  updatedAt?: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: 'active' | 'inactive';
    role?: string;
  };
};

export async function listPatients(params: { search?: string; limit?: number; skip?: number } = {}) {
  const response = await api.get('/api/patients', { params });
  return (response.data?.data ?? []) as AdminPatientListItem[];
}

export async function getPatient(id: string) {
  const response = await api.get(`/api/patients/${id}`);
  return response.data?.data as AdminPatientDetail;
}
