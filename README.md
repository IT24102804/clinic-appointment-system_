# Clinic Appointment System

Shared mobile and backend foundation for the group assignment.

## Current status
- Expo mobile app is set up and running.
- Express backend is set up and connected to MongoDB Atlas.
- Prescription Management is implemented as the reference module.
- Shared mobile shell, shared UI components, and starter templates are in place.

## Shared project update
- The base project structure is already in place in the main repository.
- Prescription Management is the working reference module for both backend and mobile structure.
- The remaining modules should follow the same pattern instead of introducing new layouts or folder structures.

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

## Recommended first steps
1. Clone the repository.
2. Run backend and mobile locally.
3. Read:
   - `README.md`
   - `docs/MODULE_OWNERSHIP.md`
   - `docs/PRESCRIPTION_REFERENCE.md`
4. Study the Prescription module first.
5. Copy from:
   - `backend/templates/module-template`
   - `mobile/templates/module-template`
6. Start only the assigned module in a feature branch.

## Shared rules
- Use the shared repo only.
- Do not create a separate navbar, layout system, or color palette.
- Do not hardcode final data.
- Do not edit shared shell files unless the reason is clearly explained in the PR.
- Keep the shared response envelope as `success`, `message`, and `data`.

## Key docs
- [Module ownership](./docs/MODULE_OWNERSHIP.md)
- [Prescription reference](./docs/PRESCRIPTION_REFERENCE.md)
