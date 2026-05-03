# Database Schema Diagram

MongoDB uses collections and documents. This project uses separate collections for core entities and references them with ObjectIds.

```mermaid
erDiagram
  USER {
    ObjectId _id
    string referenceId
    string name
    string email
    string passwordHash
    string role
    string status
  }
  PATIENT {
    ObjectId _id
    ObjectId userId
    string referenceId
    string fullName
    number age
    string gender
    string phone
    string nic
    date dateOfBirth
    string email
    string address
    string status
    string attachmentUrl
  }
  DOCTOR {
    ObjectId _id
    string referenceId
    string fullName
    string specialization
    string phone
    string email
    string room
    number experienceYears
    number sessionFee
    array availability
    string availabilityStatus
    string profileImageUrl
  }
  APPOINTMENT {
    ObjectId _id
    string referenceId
    ObjectId patientId
    ObjectId doctorId
    date appointmentDate
    string timeSlot
    string reason
    string status
    string attachmentUrl
  }
  PRESCRIPTION {
    ObjectId _id
    string referenceId
    ObjectId appointmentId
    ObjectId patientId
    ObjectId doctorId
    string diagnosis
    array medicines
    string status
    string attachmentUrl
  }
  BILLING {
    ObjectId _id
    string referenceId
    ObjectId patientId
    ObjectId appointmentId
    number amount
    date billDate
    string paymentMethod
    string paymentStatus
    string receiptUrl
  }
  MEDICAL_RECORD {
    ObjectId _id
    string referenceId
    ObjectId patientId
    ObjectId doctorId
    ObjectId appointmentId
    string visitSummary
    string diagnosis
    string treatmentNotes
    date recordDate
    string attachmentUrl
  }
  PATIENT_DOCUMENT {
    ObjectId _id
    string referenceId
    ObjectId patientId
    ObjectId uploadedBy
    string title
    string documentType
    string fileUrl
    string status
    ObjectId reviewedBy
  }

  PATIENT ||--o{ APPOINTMENT : books
  DOCTOR ||--o{ APPOINTMENT : handles
  APPOINTMENT ||--o{ PRESCRIPTION : produces
  APPOINTMENT ||--o{ BILLING : creates
  APPOINTMENT ||--o{ MEDICAL_RECORD : documents
  PATIENT ||--o{ PRESCRIPTION : receives
  DOCTOR ||--o{ PRESCRIPTION : issues
  PATIENT ||--o{ BILLING : pays
  PATIENT ||--o{ MEDICAL_RECORD : owns
  DOCTOR ||--o{ MEDICAL_RECORD : writes
  USER ||--o| PATIENT : owns
  PATIENT ||--o{ PATIENT_DOCUMENT : uploads
```

## Design Notes
- MongoDB `_id` remains the real database key used for relationships.
- `referenceId` is a human-friendly display ID for staff and demo use, such as `PAT-0001`, `DOC-0001`, `APT-0001`, `RX-0001`, `BILL-0001`, `MR-0001`, and `STF-0001`.
- Patient login is linked by `Patient.userId`, while admin-created patient records can exist without a login account.
- Patient-uploaded documents are supporting submissions; doctors/admins review them before they are treated as official medical records.
- Medicines are embedded inside `Prescription` because they are always used together with the prescription.
- Patient, doctor, and appointment data are referenced because they are independent modules.
- File metadata is stored in each module document, while actual files are stored in Cloudinary.
