# Backend Module Template

Copy these files into `backend/src` and replace every `TODO_...` marker.

Expected structure for each member:
- `models/<Entity>.js`
- `validators/<entity>Validators.js`
- `controllers/<entity>Controller.js`
- `routes/<entity>Routes.js`

Rules:
- keep the shared response envelope: `success`, `message`, `data`
- use the shared validation middleware
- do not mount routes directly in `src/app.js`; ask the integration lead to do that

Example destinations:
- Patient: `models/Patient.js`, `validators/patientValidators.js`, `controllers/patientController.js`, `routes/patientRoutes.js`
- Doctor: `models/Doctor.js`, `validators/doctorValidators.js`, `controllers/doctorController.js`, `routes/doctorRoutes.js`
- Appointment: `models/Appointment.js`, `validators/appointmentValidators.js`, `controllers/appointmentController.js`, `routes/appointmentRoutes.js`
- Billing: `models/Billing.js`, `validators/billingValidators.js`, `controllers/billingController.js`, `routes/billingRoutes.js`
- Medical Record: `models/MedicalRecord.js`, `validators/medicalRecordValidators.js`, `controllers/medicalRecordController.js`, `routes/medicalRecordRoutes.js`
