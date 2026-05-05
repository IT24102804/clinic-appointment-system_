const { api, authHeader, loginAdmin, nextWeekdayDate, unique } = require("./helpers/api");
const { createCompletedAppointment, createDoctor, medicinePayload } = require("./helpers/factory");

describe("Member 4 - Prescription Management module tests", () => {
  let token;
  let appointment;
  let prescription;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
    ({ appointment } = await createCompletedAppointment(token));
  });

  test("PRE-01 rejects prescription list without token", async () => {
    const response = await api.get("/api/prescriptions");
    expect(response.status).toBe(401);
  });

  test("PRE-02 creates prescription for completed appointment", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Viral fever",
      medicines: [medicinePayload()],
      notes: "Automated prescription test",
      status: "draft",
    });
    expect(response.status).toBe(201);
    prescription = response.body.data;
    expect(prescription._id).toBeTruthy();
  });

  test("PRE-03 rejects invalid appointment ID", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: "bad",
      diagnosis: "Invalid appointment",
      medicines: [medicinePayload()],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-04 rejects empty diagnosis", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "",
      medicines: [medicinePayload()],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-05 rejects empty medicine name", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Invalid medicine",
      medicines: [medicinePayload({ name: "" })],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-06 rejects invalid dosage", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Invalid dosage",
      medicines: [medicinePayload({ dosage: "bad" })],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-07 rejects empty frequency", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Invalid frequency",
      medicines: [medicinePayload({ frequency: "" })],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-08 rejects invalid duration", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Invalid duration",
      medicines: [medicinePayload({ duration: "soon" })],
    });
    expect(response.status).toBe(400);
  });

  test("PRE-09 blocks duplicate prescription for appointment", async () => {
    const response = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: appointment._id,
      diagnosis: "Duplicate",
      medicines: [medicinePayload()],
      status: "draft",
    });
    expect(response.status).toBe(409);
  });

  test("PRE-10 lists prescriptions", async () => {
    const response = await api.get("/api/prescriptions").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("PRE-11 reads prescription by valid ID", async () => {
    const response = await api.get(`/api/prescriptions/${prescription._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(prescription._id);
  });

  test("PRE-12 updates diagnosis", async () => {
    const response = await api.put(`/api/prescriptions/${prescription._id}`).set(authHeader(token)).send({
      diagnosis: "Updated diagnosis",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.diagnosis).toBe("Updated diagnosis");
  });

  test("PRE-13 updates medicine duration", async () => {
    const response = await api.put(`/api/prescriptions/${prescription._id}`).set(authHeader(token)).send({
      medicines: [medicinePayload({ duration: "7 days" })],
    });
    expect(response.status).toBe(200);
    expect(response.body.data.medicines[0].duration).toBe("7 days");
  });

  test("PRE-14 deletes draft prescription", async () => {
    const { appointment: draftAppointment } = await createCompletedAppointment(token);
    const create = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: draftAppointment._id,
      diagnosis: "Draft diagnosis",
      medicines: [medicinePayload()],
      status: "draft",
    });
    expect(create.status).toBe(201);

    const response = await api.delete(`/api/prescriptions/${create.body.data._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
  });

  test("PRE-15 lets patient read own prescription", async () => {
    const doctor = await createDoctor(token);
    const suffix = unique("");
    const register = await api.post("/api/auth/register-patient").send({
      fullName: `Prescription Patient ${suffix}`,
      email: `prescriptionpatient${suffix}@example.com`,
      password: "Patient@1234",
      gender: "female",
      phone: `075${String(suffix).slice(-7).padStart(7, "0")}`,
      nic: `2002${String(suffix).slice(-8).padStart(8, "0")}`,
      dateOfBirth: "2000-05-15",
      address: "No. 15, Prescription Road, Colombo",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0771234567",
        relationship: "Father",
      },
    });
    expect(register.status).toBe(201);
    const patientToken = register.body.data.accessToken || register.body.data.token;

    const request = await api.post("/api/patient/appointments").set(authHeader(patientToken)).send({
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "09:30 AM",
      reason: "Prescription visibility test",
    });
    expect(request.status).toBe(201);

    const complete = await api.put(`/api/appointments/${request.body.data._id}`).set(authHeader(token)).send({ status: "completed" });
    expect(complete.status).toBe(200);

    const created = await api.post("/api/prescriptions").set(authHeader(token)).send({
      appointmentId: request.body.data._id,
      diagnosis: "Patient visible diagnosis",
      medicines: [medicinePayload()],
      status: "draft",
    });
    expect(created.status).toBe(201);

    const response = await api.get("/api/patient/prescriptions").set(authHeader(patientToken));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
