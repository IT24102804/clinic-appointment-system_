# Module Ownership

## Shared by all members
### Authentication / User Management
Everyone must contribute to and understand:
- registration
- login
- password hashing
- JWT / auth token flow
- protected routes

This is a shared group function, not one person's solo module.

## Shared backend structure
All backend files should be added only in:
- `backend/src/models/<Entity>.js`
- `backend/src/validators/<entity>Validators.js`
- `backend/src/controllers/<entity>Controller.js`
- `backend/src/routes/<entity>Routes.js`

## Shared mobile structure
All mobile files should be added only in:
- `mobile/services/<entity>.ts`
- one module entry screen
- one detail screen
- one create screen
- one edit screen

## Member 1 - Patient Management
Build:
- patient schema
- patient CRUD routes
- patient list screen
- patient detail screen
- patient create/edit screen
- patient mobile service

Must understand:
- patients connect to appointments, prescriptions, billing, and medical records

Backend file map:
- `backend/src/models/Patient.js`
- `backend/src/validators/patientValidators.js`
- `backend/src/controllers/patientController.js`
- `backend/src/routes/patientRoutes.js`

Mobile file map:
- `mobile/services/patients.ts`
- replace `mobile/app/placeholders/patients.tsx`
- `mobile/app/patients/[id].tsx`
- `mobile/app/patients/new.tsx`
- `mobile/app/patients/[id]/edit.tsx`

## Member 2 - Doctor Management
Build:
- doctor schema
- doctor CRUD routes
- doctor list screen
- doctor detail screen
- doctor create/edit screen
- doctor mobile service

Must understand:
- doctors connect to appointments, prescriptions, and medical records

Backend file map:
- `backend/src/models/Doctor.js`
- `backend/src/validators/doctorValidators.js`
- `backend/src/controllers/doctorController.js`
- `backend/src/routes/doctorRoutes.js`

Mobile file map:
- `mobile/services/doctors.ts`
- replace `mobile/app/placeholders/doctors.tsx`
- `mobile/app/doctors/[id].tsx`
- `mobile/app/doctors/new.tsx`
- `mobile/app/doctors/[id]/edit.tsx`

## Member 3 - Appointment Scheduling
Build:
- appointment schema
- appointment create/list/update/cancel routes
- appointment list screen
- appointment detail screen
- appointment create/edit screen
- appointment mobile service

Must understand:
- appointments are the bridge between patient and doctor
- prescriptions and billing depend on appointments

Backend file map:
- `backend/src/models/Appointment.js`
- `backend/src/validators/appointmentValidators.js`
- `backend/src/controllers/appointmentController.js`
- `backend/src/routes/appointmentRoutes.js`

Mobile file map:
- `mobile/services/appointments.ts`
- replace `mobile/app/(tabs)/appointments.tsx`
- `mobile/app/appointments/[id].tsx`
- `mobile/app/appointments/new.tsx`
- `mobile/app/appointments/[id]/edit.tsx`

## Member 4 - Prescription Management
Build and maintain:
- prescription schema
- medicines array
- CRUD routes
- attachment upload
- prescription list screen
- prescription detail screen
- prescription create/edit screen
- prescription mobile service

Must understand:
- prescriptions connect appointment, patient, and doctor
- medicines are stored inside the prescription document
- uploads are handled separately from normal CRUD payloads

Backend reference files:
- `backend/src/models/Prescription.js`
- `backend/src/validators/prescriptionValidators.js`
- `backend/src/controllers/prescriptionController.js`
- `backend/src/routes/prescriptionRoutes.js`

Mobile reference files:
- `mobile/services/prescriptions.ts`
- `mobile/app/(tabs)/prescriptions.tsx`
- `mobile/app/prescriptions/new.tsx`
- `mobile/app/prescriptions/[id].tsx`
- `mobile/app/prescriptions/[id]/edit.tsx`
- `mobile/components/prescription-form.tsx`

## Member 5 - Billing Management
Build:
- billing schema
- billing CRUD routes
- billing list screen
- billing detail screen
- billing create/edit screen
- billing mobile service

Must understand:
- billing connects to patient and appointment
- payment status should be simple and easy to explain

Backend file map:
- `backend/src/models/Billing.js`
- `backend/src/validators/billingValidators.js`
- `backend/src/controllers/billingController.js`
- `backend/src/routes/billingRoutes.js`

Mobile file map:
- `mobile/services/billing.ts`
- replace `mobile/app/placeholders/billing.tsx`
- `mobile/app/billing/[id].tsx`
- `mobile/app/billing/new.tsx`
- `mobile/app/billing/[id]/edit.tsx`

## Member 6 - Medical Records
Build:
- medical record schema
- medical record CRUD routes
- medical record list screen
- medical record detail screen
- medical record create/edit screen
- medical record mobile service

Must understand:
- medical records connect patient, doctor, and appointment
- this module supports long-term clinical history

Backend file map:
- `backend/src/models/MedicalRecord.js`
- `backend/src/validators/medicalRecordValidators.js`
- `backend/src/controllers/medicalRecordController.js`
- `backend/src/routes/medicalRecordRoutes.js`

Mobile file map:
- `mobile/services/medical-records.ts`
- replace `mobile/app/placeholders/medical-records.tsx`
- `mobile/app/medical-records/[id].tsx`
- `mobile/app/medical-records/new.tsx`
- `mobile/app/medical-records/[id]/edit.tsx`

## Integration-owned files
These remain controlled through integration review:
- `mobile/app/_layout.tsx`
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/components/ui/*`
- `mobile/constants/design.ts`
- route mounting in `backend/src/app.js`

## Minimum check before opening a PR
Each module owner should verify:
- backend still starts
- mobile still opens with the shared shell
- shared UI components are used
- real backend data is used
- schema, routes, screens, and module relationships can be explained in viva
