const { api, authHeader, loginAdmin, nextWeekdayDate, unique } = require("./helpers/api");
const { createDoctor, medicinePayload } = require("./helpers/factory");

describe("System flow testing - patient request to clinical records", () => {
  test("runs patient registration, appointment request, staff confirmation, prescription, billing, and record viewing", async () => {
    const { token: adminToken } = await loginAdmin();
    const doctor = await createDoctor(adminToken);
    const suffix = unique("");

    const registration = await api.post("/api/auth/register-patient").send({
      fullName: `System Patient ${suffix}`,
      email: `systempatient${suffix}@example.com`,
      password: "Patient@1234",
      gender: "female",
      phone: `075${String(suffix).slice(-7).padStart(7, "0")}`,
      nic: `2000${String(suffix).slice(-8).padStart(8, "0")}`,
      dateOfBirth: "2000-05-15",
      address: "No. 55, System Flow Road, Colombo",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0771234567",
        relationship: "Father",
      },
    });
    expect(registration.status).toBe(201);
    const patientToken = registration.body.data.accessToken || registration.body.data.token;

    const doctors = await api.get("/api/patient/doctors").set(authHeader(patientToken));
    expect(doctors.status).toBe(200);

    const slots = await api
      .get(`/api/patient/doctors/${doctor._id}/slots`)
      .query({ date: nextWeekdayDate(1) })
      .set(authHeader(patientToken));
    expect(slots.status).toBe(200);
    expect(Array.isArray(slots.body.data)).toBe(true);

    const requestAppointment = await api.post("/api/patient/appointments").set(authHeader(patientToken)).send({
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "09:30 AM",
      reason: "System flow appointment request",
    });
    expect(requestAppointment.status).toBe(201);
    const appointment = requestAppointment.body.data;

    const confirmAppointment = await api
      .put(`/api/appointments/${appointment._id}`)
      .set(authHeader(adminToken))
      .send({ status: "completed" });
    expect(confirmAppointment.status).toBe(200);

    const prescription = await api.post("/api/prescriptions").set(authHeader(adminToken)).send({
      appointmentId: appointment._id,
      diagnosis: "System flow diagnosis",
      medicines: [medicinePayload()],
      status: "draft",
    });
    expect(prescription.status).toBe(201);

    const bill = await api.post("/api/billing").set(authHeader(adminToken)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "paid",
    });
    expect(bill.status).toBe(201);

    const medicalRecord = await api.post("/api/medical-records").set(authHeader(adminToken)).send({
      appointmentId: appointment._id,
      visitSummary: "System flow visit summary",
      diagnosis: "System flow diagnosis",
      treatmentNotes: "System flow treatment notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(medicalRecord.status).toBe(201);

    const patientAppointments = await api.get("/api/patient/appointments").set(authHeader(patientToken));
    expect(patientAppointments.status).toBe(200);

    const patientPrescriptions = await api.get("/api/patient/prescriptions").set(authHeader(patientToken));
    expect(patientPrescriptions.status).toBe(200);

    const patientBills = await api.get("/api/patient/billing").set(authHeader(patientToken));
    expect(patientBills.status).toBe(200);

    const patientRecords = await api.get("/api/patient/medical-records").set(authHeader(patientToken));
    expect(patientRecords.status).toBe(200);
  });
});
