const { api, authHeader, loginAdmin, nextWeekdayDate } = require("./helpers/api");
const { createAppointment, createDoctor, createPatient } = require("./helpers/factory");

describe("Member 3 - Appointment Scheduling module tests", () => {
  let token;
  let patient;
  let doctor;
  let appointment;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
    patient = await createPatient(token);
    doctor = await createDoctor(token);
  });

  test("APP-01 rejects appointment list without token", async () => {
    const response = await api.get("/api/appointments");
    expect(response.status).toBe(401);
  });

  test("APP-02 creates appointment with valid patient and doctor", async () => {
    appointment = await createAppointment(token, patient._id, doctor._id, { timeSlot: "10:00 AM" });
    expect(appointment._id).toBeTruthy();
  });

  test("APP-03 rejects invalid patient ID", async () => {
    const response = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: "bad",
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "10:30 AM",
      reason: "Invalid patient test",
    });
    expect(response.status).toBe(400);
  });

  test("APP-04 rejects invalid doctor ID", async () => {
    const response = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: "bad",
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "10:30 AM",
      reason: "Invalid doctor test",
    });
    expect(response.status).toBe(400);
  });

  test("APP-05 rejects invalid appointment date", async () => {
    const response = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: "bad-date",
      timeSlot: "10:30 AM",
      reason: "Invalid date test",
    });
    expect(response.status).toBe(400);
  });

  test("APP-06 rejects empty time slot", async () => {
    const response = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "",
      reason: "Empty slot test",
    });
    expect(response.status).toBe(400);
  });

  test("APP-07 rejects empty reason", async () => {
    const response = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "10:45 AM",
      reason: "",
    });
    expect(response.status).toBe(400);
  });

  test("APP-08 blocks duplicate doctor date and time slot", async () => {
    const appointmentDate = nextWeekdayDate(1);
    await createAppointment(token, patient._id, doctor._id, {
      appointmentDate,
      timeSlot: "11:00 AM",
    });

    const duplicate = await api.post("/api/appointments").set(authHeader(token)).send({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate,
      timeSlot: "11:00 AM",
      reason: "Duplicate slot test",
      status: "confirmed",
    });
    expect(duplicate.status).toBe(409);
  });

  test("APP-09 lists appointments", async () => {
    const response = await api.get("/api/appointments").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("APP-10 filters appointments by patient", async () => {
    const response = await api.get("/api/appointments").query({ patientId: patient._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("APP-11 filters appointments by doctor", async () => {
    const response = await api.get("/api/appointments").query({ doctorId: doctor._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("APP-12 reads appointment by valid ID", async () => {
    const response = await api.get(`/api/appointments/${appointment._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(appointment._id);
  });

  test("APP-13 updates appointment status", async () => {
    const response = await api.put(`/api/appointments/${appointment._id}`).set(authHeader(token)).send({ status: "completed" });
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");
  });

  test("APP-14 rejects invalid appointment status", async () => {
    const response = await api.put(`/api/appointments/${appointment._id}`).set(authHeader(token)).send({ status: "wrong" });
    expect(response.status).toBe(400);
  });

  test("APP-15 deletes appointment", async () => {
    const removable = await createAppointment(token, patient._id, doctor._id, { timeSlot: "12:00 PM" });
    const response = await api.delete(`/api/appointments/${removable._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
  });
});
