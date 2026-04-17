# Clinic Appointment System

Shared mobile and backend foundation for the group assignment.

## Current status
- Expo mobile app is set up and running.
- Express backend is set up and connected to MongoDB Atlas.
- Prescription Management is implemented as the reference module.
- Shared mobile shell, shared UI components, and starter templates are in place.

## Module split
- Member 1: Patient Management
- Member 2: Doctor Management
- Member 3: Appointment Scheduling
- Member 4: Prescription Management
- Member 5: Billing Management
- Member 6: Medical Records
- Shared by all members: Authentication / User Management

## Quick start

### Backend
```powershell
cd backend
npm install
npm run dev
```

### Mobile
```powershell
cd mobile
npm install
npm start
```

## Team workflow
- Do not push directly to `main`.
- Each member works in a `feature/<module>` branch.
- Open a pull request to `main` when your module is ready.
- Use the Prescription module and the templates as the structure reference.

## Key docs
- [Module ownership](./docs/MODULE_OWNERSHIP.md)
- [Prescription reference](./docs/PRESCRIPTION_REFERENCE.md)
