# Prescription Module Reference

Prescription Management is the reference module for the rest of the team.

## Why this module matters
It already demonstrates:
- backend model, validator, controller, and route structure
- shared backend response format
- mobile service layer using `fetch`
- reusable form pattern
- list, detail, create, and edit screens
- attachment upload without breaking the module structure

## Backend reference files
- `backend/src/models/Prescription.js`
- `backend/src/validators/prescriptionValidators.js`
- `backend/src/controllers/prescriptionController.js`
- `backend/src/routes/prescriptionRoutes.js`

## Mobile reference files
- `mobile/services/prescriptions.ts`
- `mobile/components/prescription-form.tsx`
- `mobile/app/(tabs)/prescriptions.tsx`
- `mobile/app/prescriptions/new.tsx`
- `mobile/app/prescriptions/[id].tsx`
- `mobile/app/prescriptions/[id]/edit.tsx`

## What teammates should learn from it
- how one entity is modeled in MongoDB
- how request validation is structured
- how controller logic maps to CRUD operations
- how mobile screens call the backend
- how a module fits into the shared app shell
- how one module connects mobile -> API -> MongoDB without inventing a second app structure

## Data shape
Prescription uses:
- `appointmentId`
- `patientId`
- `doctorId`
- `diagnosis`
- `medicines[]`
- `notes`
- `status`
- `attachmentUrl`
- `attachmentName`
- `issuedAt`

## Important behavior to copy
- keep one module per feature owner
- separate data model, validation, controller logic, and routes
- keep mobile fetch logic in a service file
- keep forms reusable where possible
- use shared UI components instead of module-specific styling systems

## What to study first
Study the reference in this order:
1. `backend/src/models/Prescription.js`
2. `backend/src/validators/prescriptionValidators.js`
3. `backend/src/controllers/prescriptionController.js`
4. `backend/src/routes/prescriptionRoutes.js`
5. `mobile/services/prescriptions.ts`
6. `mobile/components/prescription-form.tsx`
7. `mobile/app/(tabs)/prescriptions.tsx`
8. `mobile/app/prescriptions/new.tsx`
9. `mobile/app/prescriptions/[id].tsx`
10. `mobile/app/prescriptions/[id]/edit.tsx`

## What should be copied from this module
- backend naming pattern
- validator/controller/route separation
- service-based fetch logic
- list/detail/create-edit screen flow
- reusable form structure
- use of shared UI components instead of custom module styling
