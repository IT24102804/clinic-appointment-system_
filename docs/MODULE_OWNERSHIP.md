# Module Ownership

## Shared by all members
### Authentication / User Management
Everyone must contribute to and understand:
- registration
- login
- password hashing
- JWT / auth token flow
- protected routes

This is a shared group function, not one person’s solo module.

## Member 1 — Patient Management
Build:
- patient schema
- patient CRUD routes
- patient list screen
- patient detail screen
- patient create/edit screen
- patient mobile service

Must understand:
- patients connect to appointments, prescriptions, billing, and medical records

## Member 2 — Doctor Management
Build:
- doctor schema
- doctor CRUD routes
- doctor list screen
- doctor detail screen
- doctor create/edit screen
- doctor mobile service

Must understand:
- doctors connect to appointments, prescriptions, and medical records

## Member 3 — Appointment Scheduling
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

## Member 4 — Prescription Management
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

## Member 5 — Billing Management
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

## Member 6 — Medical Records
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
