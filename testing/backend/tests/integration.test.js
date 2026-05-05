const { api, authHeader, loginAdmin, nextWeekdayDate, unique } = require("./helpers/api");
const {
  createAppointment,
  createCompletedAppointment,
  createDoctor,
  createPatient,
  medicinePayload,
} = require("./helpers/factory");

describe("Integration testing - 6 backlog scenarios", () => {
  let token;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
  });

  test("INT-01 creates linked patient, doctor, and appointment records", async () => {
    const patient = await createPatient(token);
    const doctor = await createDoctor(token);
    const appointment = await createAppointment(token, patient._id, doctor._id);

    expect(appointment.patientId._id || appointment.patientId).toBeTruthy();
    expect(appointment.doctorId._id || appointment.doctorId).toBeTruthy();
  });

  test("INT-02 creates a prescription from a completed appointment", async () => {
    const { appointment } = await createCompletedAppointment(token);

    const prescription = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Integrated prescription diagnosis",
      medicines: [medicinePayload()],
      status: "draft",
    });

    expect(prescription.status).toBe(201);
    expect(prescription.body.data.appointmentId._id || prescription.body.data.appointmentId).toBeTruthy();
  });

  test("INT-03 creates billing from a completed appointment", async () => {
    const { appointment } = await createCompletedAppointment(token);

    const bill = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      paymentStatus: "paid",
    });

    expect(bill.status).toBe(201);
    expect(bill.body.data.paymentStatus).toBe("paid");
  });

  test("INT-04 creates a medical record from a completed appointment", async () => {
    const { appointment } = await createCompletedAppointment(token);

    const medicalRecord = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Integrated flow visit summary",
      diagnosis: "Integrated diagnosis",
      treatmentNotes: "Integrated treatment notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });

    expect(medicalRecord.status).toBe(201);
    expect(medicalRecord.body.data.patientId._id || medicalRecord.body.data.patientId).toBeTruthy();
    expect(medicalRecord.body.data.doctorId._id || medicalRecord.body.data.doctorId).toBeTruthy();
  });

  test("INT-05 blocks duplicate appointment slots", async () => {
    const patient = await createPatient(token);
    const doctor = await createDoctor(token);
    const appointmentDate = nextWeekdayDate(1);
    await createAppointment(token, patient._id, doctor._id, {
      appointmentDate,
      timeSlot: "11:30 AM",
    });

    const duplicate = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate,
      timeSlot: "11:30 AM",
      reason: "Duplicate integration slot",
      status: "confirmed",
    });

    expect(duplicate.status).toBe(409);
  });

  test("INT-06 patient books and views own backlog records", async () => {
    const doctor = await createDoctor(token);
    const suffix = unique("");

    const registration = await api.post("/api/auth/register-patient").send({
      fullName: `Integration Patient ${suffix}`,
      email: `integrationpatient${suffix}@example.com`,
      password: "Patient@1234",
      gender: "female",
      phone: `075${String(suffix).slice(-7).padStart(7, "0")}`,
      nic: `2000${String(suffix).slice(-8).padStart(8, "0")}`,
      dateOfBirth: "2000-05-15",
      address: "No. 12, Integration Road, Colombo",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0771234567",
        relationship: "Father",
      },
    });
    expect(registration.status).toBe(201);
    const patientToken = registration.body.data.accessToken || registration.body.data.token;

    const appointmentRequest = await api.post("/api/patient/appointments").set(authHeader(patientToken)).send({
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "02:30 PM",
      reason: "Integration patient backlog request",
    });
    expect(appointmentRequest.status).toBe(201);

    const patientAppointments = await api.get("/api/patient/appointments").set(authHeader(patientToken));
    expect(patientAppointments.status).toBe(200);
    expect(Array.isArray(patientAppointments.body.data)).toBe(true);
  });
});
