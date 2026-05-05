# Clinic Appointment System Testing

This folder contains the essential API tests for the clinic appointment system.

Testing tool: Jest with Axios.

Default deployed backend:

```text
https://clinic-appointment-system-ji86.onrender.com
```

## What To Include

Keep only these testing files:

```text
testing/
`-- backend/
    |-- package.json
    |-- jest.config.js
    |-- .env.test.example
    `-- tests/
```

Do not commit `node_modules`. Each member installs dependencies locally.

## Setup

```powershell
cd D:\clinic-app\testing\backend
npm.cmd install
Copy-Item .env.test.example .env.test
```

Edit `testing/backend/.env.test`:

```text
BASE_URL=https://clinic-appointment-system-ji86.onrender.com
TEST_ADMIN_EMAIL=your-active-admin-email
TEST_ADMIN_PASSWORD=your-active-admin-password
```

Run all tests:

```powershell
npm.cmd test
```

Run one module:

```powershell
npm.cmd run test:patients
npm.cmd run test:doctors
npm.cmd run test:appointments
npm.cmd run test:prescriptions
npm.cmd run test:billing
npm.cmd run test:medical-records
npm.cmd run test:integration
npm.cmd run test:system
```

## Backlog Testing Focus

Backlog testing verifies that the completed backlog items work in the running system. Keep it simple:

1. Start with the deployed or local backend.
2. Confirm authentication works.
3. Test each member module through normal API requests.
4. Test the linked workflow across modules.
5. Record only pass/fail notes and important errors.

## Integration Testing

Create 6 integration scenarios:

| ID | Scenario | Expected Result |
| --- | --- | --- |
| INT-01 | Admin logs in, creates a patient, creates a doctor, and books an appointment. | Linked patient, doctor, and appointment records are created. |
| INT-02 | Completed appointment is used to create a prescription. | Prescription stores the correct appointment reference. |
| INT-03 | Completed appointment is used to create a bill. | Bill stores the appointment and payment status. |
| INT-04 | Completed appointment is used to create a medical record. | Medical record stores patient and doctor references from the appointment. |
| INT-05 | Duplicate appointment, prescription, billing, or medical record is submitted. | API blocks duplicate records with a clear error. |
| INT-06 | Patient registers, books an appointment, and views appointments, prescriptions, bills, and records. | Patient can view only their own linked records. |

## System Flow

System flow test:

1. Patient registers.
2. Patient views doctors.
3. Patient checks doctor slots.
4. Patient requests an appointment.
5. Admin or staff completes the appointment.
6. Admin or doctor creates prescription and medical record.
7. Admin or receptionist creates billing.
8. Patient views appointment, prescription, bill, and medical record.

Expected result: the full clinic flow works from booking to clinical and billing records.

## Unit/Module Testing

Each member must provide at least 15 clear test cases for their module.

### Member 1 - Patient Management

| ID | Test Case | Expected Result |
| --- | --- | --- |
| PAT-01 | Create patient without token. | Request is rejected. |
| PAT-02 | Create patient with valid data. | Patient is created. |
| PAT-03 | Create patient with empty full name. | Validation error. |
| PAT-04 | Create patient with invalid gender. | Validation error. |
| PAT-05 | Create patient with invalid phone. | Validation error. |
| PAT-06 | Create patient with invalid NIC. | Validation error. |
| PAT-07 | Create patient with invalid date of birth. | Validation error. |
| PAT-08 | Create duplicate patient phone, NIC, or email. | Duplicate is blocked. |
| PAT-09 | List patients with valid token. | Patient list is returned. |
| PAT-10 | Read patient by valid ID. | Correct patient is returned. |
| PAT-11 | Read patient by invalid ID. | Validation error. |
| PAT-12 | Update patient address. | Address is changed. |
| PAT-13 | Update patient with invalid data. | Validation error. |
| PAT-14 | Delete patient as admin. | Patient becomes inactive. |
| PAT-15 | Patient updates own profile. | Profile changes are saved. |
| PAT-16 | Patient deletes own additional address. | Additional address is removed. |
| PAT-17 | Patient deletes own emergency contact. | Emergency contact is cleared. |

### Member 2 - Doctor Management

| ID | Test Case | Expected Result |
| --- | --- | --- |
| DOC-01 | Create doctor without token. | Request is rejected. |
| DOC-02 | Create doctor with valid data. | Doctor is created. |
| DOC-03 | Create doctor with empty name. | Validation error. |
| DOC-04 | Create doctor with empty specialization. | Validation error. |
| DOC-05 | Create doctor with invalid phone. | Validation error. |
| DOC-06 | Create doctor with invalid email. | Validation error. |
| DOC-07 | Create doctor with invalid availability day. | Validation error. |
| DOC-08 | Create doctor with invalid time format. | Validation error. |
| DOC-09 | Create duplicate doctor phone or email. | Duplicate is blocked. |
| DOC-10 | List doctors. | Doctor list is returned. |
| DOC-11 | Read doctor by valid ID. | Correct doctor is returned. |
| DOC-12 | Read doctor by invalid ID. | Validation error. |
| DOC-13 | Update doctor room. | Room is changed. |
| DOC-14 | Update availability status. | Status is changed. |
| DOC-15 | Delete unused doctor. | Doctor is removed. |

### Member 3 - Appointment Scheduling

| ID | Test Case | Expected Result |
| --- | --- | --- |
| APP-01 | List appointments without token. | Request is rejected. |
| APP-02 | Create appointment with valid patient and doctor. | Appointment is created. |
| APP-03 | Create appointment with invalid patient ID. | Validation error. |
| APP-04 | Create appointment with invalid doctor ID. | Validation error. |
| APP-05 | Create appointment with invalid date. | Validation error. |
| APP-06 | Create appointment with empty time slot. | Validation error. |
| APP-07 | Create appointment with empty reason. | Validation error. |
| APP-08 | Create duplicate doctor, date, and time slot. | Duplicate is blocked. |
| APP-09 | List appointments. | Appointment list is returned. |
| APP-10 | Filter appointments by patient. | Matching appointments are returned. |
| APP-11 | Filter appointments by doctor. | Matching appointments are returned. |
| APP-12 | Read appointment by valid ID. | Correct appointment is returned. |
| APP-13 | Update appointment status. | Status is changed. |
| APP-14 | Update appointment with invalid status. | Validation error. |
| APP-15 | Delete appointment. | Appointment is removed. |

### Member 4 - Prescription Management

| ID | Test Case | Expected Result |
| --- | --- | --- |
| PRE-01 | List prescriptions without token. | Request is rejected. |
| PRE-02 | Create prescription for completed appointment. | Prescription is created. |
| PRE-03 | Create prescription with invalid appointment ID. | Validation error. |
| PRE-04 | Create prescription with empty diagnosis. | Validation error. |
| PRE-05 | Create prescription with empty medicine name. | Validation error. |
| PRE-06 | Create prescription with invalid dosage. | Validation error. |
| PRE-07 | Create prescription with empty frequency. | Validation error. |
| PRE-08 | Create prescription with invalid duration. | Validation error. |
| PRE-09 | Create duplicate prescription for appointment. | Duplicate is blocked. |
| PRE-10 | List prescriptions. | Prescription list is returned. |
| PRE-11 | Read prescription by valid ID. | Correct prescription is returned. |
| PRE-12 | Update diagnosis. | Diagnosis is changed. |
| PRE-13 | Update medicine duration. | Duration is changed. |
| PRE-14 | Delete draft prescription. | Prescription is removed. |
| PRE-15 | Patient reads own prescription. | Patient can view linked prescription. |

### Member 5 - Billing Management

| ID | Test Case | Expected Result |
| --- | --- | --- |
| BIL-01 | List billing without token. | Request is rejected. |
| BIL-02 | Create bill for completed appointment. | Bill is created. |
| BIL-03 | Create bill with invalid appointment ID. | Validation error. |
| BIL-04 | Create bill with negative amount. | Validation error. |
| BIL-05 | Create bill with invalid bill date. | Validation error. |
| BIL-06 | Create bill with invalid payment method. | Validation error. |
| BIL-07 | Create bill with invalid payment status. | Validation error. |
| BIL-08 | Create duplicate bill for appointment. | Duplicate is blocked. |
| BIL-09 | List bills. | Bill list is returned. |
| BIL-10 | Filter bills by patient. | Matching bills are returned. |
| BIL-11 | Filter bills by appointment. | Matching bills are returned. |
| BIL-12 | Read bill by valid ID. | Correct bill is returned. |
| BIL-13 | Update payment status to paid. | Payment status is changed. |
| BIL-14 | Update bill notes. | Notes are changed. |
| BIL-15 | Delete bill. | Bill is removed. |

### Member 6 - Medical Records

| ID | Test Case | Expected Result |
| --- | --- | --- |
| MED-01 | List records without token. | Request is rejected. |
| MED-02 | Create record for completed appointment. | Record is created. |
| MED-03 | Create record with invalid appointment ID. | Validation error. |
| MED-04 | Create record with empty visit summary. | Validation error. |
| MED-05 | Create record with empty diagnosis. | Validation error. |
| MED-06 | Create record with empty treatment notes. | Validation error. |
| MED-07 | Create record with invalid record date. | Validation error. |
| MED-08 | Create duplicate record for appointment. | Duplicate is blocked. |
| MED-09 | List records. | Record list is returned. |
| MED-10 | Filter records by patient. | Matching records are returned. |
| MED-11 | Filter records by doctor. | Matching records are returned. |
| MED-12 | Read record by valid ID. | Correct record is returned. |
| MED-13 | Update treatment notes. | Notes are changed. |
| MED-14 | Update diagnosis. | Diagnosis is changed. |
| MED-15 | Delete record as admin. | Record is removed. |

## File Management

Report generation and report exporting are not part of this simplified testing setup.

Do not include:

- Word test reports.
- JSON report output scripts.
- `testing/reports`.
- Exported screenshots or evidence folders.

Keep dependencies simple:

- Commit `package.json` and `package-lock.json`.
- Do not commit `node_modules`.
- Do not commit `.env.test`.
