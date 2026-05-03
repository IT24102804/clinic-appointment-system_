# API Endpoint Table

All protected routes require:

```text
Authorization: Bearer <jwt-token>
```

## Authentication
| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Create the first admin account only. Disabled after initial setup. | Public bootstrap only |
| POST | `/api/auth/register-patient` | Register patient login and linked patient profile | Public |
| POST | `/api/auth/login` | Login and receive JWT | Public |
| POST | `/api/auth/refresh` | Rotate refresh token and receive a new access token | Public with valid refresh token |
| POST | `/api/auth/logout` | Invalidate the current refresh token | Public with refresh token |
| GET | `/api/auth/me` | Get current user | Protected |

## User Management
| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| GET | `/api/users` | List staff users | Admin |
| POST | `/api/users` | Create staff user | Admin |
| GET | `/api/users/:id` | View staff user | Admin |
| PUT | `/api/users/:id` | Update staff user | Admin |
| DELETE | `/api/users/:id` | Deactivate staff user | Admin |

## Core CRUD Modules
| Module | Base Endpoint | File Upload Field |
| --- | --- | --- |
| Patients | `/api/patients` | `attachment` |
| Doctors | `/api/doctors` | `attachment` |
| Appointments | `/api/appointments` | `attachment` |
| Prescriptions | `/api/prescriptions` | `attachment` |
| Billing | `/api/billing` | `attachment` |
| Medical Records | `/api/medical-records` | `attachment` |

| Method | Endpoint Pattern | Purpose |
| --- | --- | --- |
| GET | `/api/<module>` | List records |
| POST | `/api/<module>` | Create record |
| GET | `/api/<module>/:id` | View one record |
| PUT | `/api/<module>/:id` | Update record |
| DELETE | `/api/<module>/:id` | Delete/deactivate record |
| POST | `/api/<module>/:id/attachment` | Upload file using Multer + Cloudinary |
| DELETE | `/api/<module>/:id/attachment` | Remove uploaded file |

## Patient Portal
| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/patients/me` | View logged-in patient profile |
| PUT | `/api/patients/me` | Update limited patient profile fields |
| GET | `/api/patient/doctors` | Patient views active doctors |
| GET | `/api/patient/doctors/:doctorId/slots?date=YYYY-MM-DD` | Patient views available appointment slots |
| POST | `/api/patient/appointments` | Patient requests appointment with `pending` status |
| GET | `/api/patient/appointments` | Patient views own appointments |
| GET | `/api/patient/prescriptions` | Patient views own prescriptions |
| GET | `/api/patient/billing` | Patient views own bills |
| GET | `/api/patient/medical-records` | Patient views own medical records |
| GET | `/api/patient/documents` | Patient views own uploaded supporting documents |
| POST | `/api/patient/documents` | Patient uploads supporting document |
| DELETE | `/api/patient/documents/:id` | Patient deletes own unreviewed document |

## Staff Patient Document Review
| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/patient-documents` | Staff views patient document submissions |
| PUT | `/api/patient-documents/:id/review` | Staff reviews/rejects/links patient document |

## Record IDs
- Every saved document keeps MongoDB `_id` as the real database relationship key.
- New records also receive a human-friendly `referenceId`.
- Prefixes: `PAT`, `DOC`, `APT`, `RX`, `BILL`, `MR`, and `STF`.
- Example: a patient can have `_id: 662...` and `referenceId: PAT-0001`.

## Upload Notes
- CRUD endpoints work with MongoDB and JWT even before Cloudinary is configured.
- Upload endpoints use Multer to receive the file, then Cloudinary to store it.
- Final demo upload requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`.
- If those values are missing, create/list/update/delete can still be tested, but upload will return a setup error.
