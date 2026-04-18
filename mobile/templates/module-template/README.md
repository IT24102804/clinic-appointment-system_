# Mobile Module Template

Copy these template files into your module route folder and replace every `TODO_...` marker.

Expected member deliverables:
- list screen
- detail screen
- create/edit screen
- service file

Rules:
- use the shared components in `mobile/components/ui`
- do not edit the shared tabs or root layout unless approved by the integration lead
- do not invent new colors, card styles, button styles, or screen padding

Example destinations:
- Patients: replace `mobile/app/placeholders/patients.tsx`, then add `mobile/app/patients/[id].tsx`, `mobile/app/patients/new.tsx`, `mobile/app/patients/[id]/edit.tsx`, and `mobile/services/patients.ts`
- Doctors: replace `mobile/app/placeholders/doctors.tsx`, then add `mobile/app/doctors/[id].tsx`, `mobile/app/doctors/new.tsx`, `mobile/app/doctors/[id]/edit.tsx`, and `mobile/services/doctors.ts`
- Appointments: replace `mobile/app/(tabs)/appointments.tsx`, then add `mobile/app/appointments/[id].tsx`, `mobile/app/appointments/new.tsx`, `mobile/app/appointments/[id]/edit.tsx`, and `mobile/services/appointments.ts`
- Billing: replace `mobile/app/placeholders/billing.tsx`, then add `mobile/app/billing/[id].tsx`, `mobile/app/billing/new.tsx`, `mobile/app/billing/[id]/edit.tsx`, and `mobile/services/billing.ts`
- Medical Records: replace `mobile/app/placeholders/medical-records.tsx`, then add `mobile/app/medical-records/[id].tsx`, `mobile/app/medical-records/new.tsx`, `mobile/app/medical-records/[id]/edit.tsx`, and `mobile/services/medical-records.ts`
