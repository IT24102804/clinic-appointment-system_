const { api, authHeader, loginAdmin } = require("./helpers/api");
const { createCompletedAppointment } = require("./helpers/factory");

describe("Member 6 - Medical Records module tests", () => {
  let token;
  let patient;
  let doctor;
  let appointment;
  let record;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
    ({ patient, doctor, appointment } = await createCompletedAppointment(token));
  });

  test("MED-01 rejects medical records list without token", async () => {
    const response = await api.get("/api/medical-records");
    expect(response.status).toBe(401);
  });

  test("MED-02 creates record for completed appointment", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Patient visited for fever.",
      diagnosis: "Viral fever",
      treatmentNotes: "Rest and hydration advised.",
      recordDate: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    expect(response.status).toBe(201);
    record = response.body.data;
    expect(record._id).toBeTruthy();
  });

  test("MED-03 rejects invalid appointment ID", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: "bad",
      visitSummary: "Summary",
      diagnosis: "Diagnosis",
      treatmentNotes: "Notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("MED-04 rejects empty visit summary", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "",
      diagnosis: "Diagnosis",
      treatmentNotes: "Notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("MED-05 rejects empty diagnosis", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Summary",
      diagnosis: "",
      treatmentNotes: "Notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("MED-06 rejects empty treatment notes", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Summary",
      diagnosis: "Diagnosis",
      treatmentNotes: "",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("MED-07 rejects invalid record date", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Summary",
      diagnosis: "Diagnosis",
      treatmentNotes: "Notes",
      recordDate: "bad-date",
    });
    expect(response.status).toBe(400);
  });

  test("MED-08 blocks duplicate record for appointment", async () => {
    const response = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: appointment._id,
      visitSummary: "Duplicate",
      diagnosis: "Duplicate",
      treatmentNotes: "Duplicate",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(409);
  });

  test("MED-09 lists records", async () => {
    const response = await api.get("/api/medical-records").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("MED-10 filters records by patient", async () => {
    const response = await api.get("/api/medical-records").query({ patientId: patient._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("MED-11 filters records by doctor", async () => {
    const response = await api.get("/api/medical-records").query({ doctorId: doctor._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("MED-12 reads record by valid ID", async () => {
    const response = await api.get(`/api/medical-records/${record._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(record._id);
  });

  test("MED-13 updates treatment notes", async () => {
    const response = await api.put(`/api/medical-records/${record._id}`).set(authHeader(token)).send({
      treatmentNotes: "Updated treatment notes.",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.treatmentNotes).toBe("Updated treatment notes.");
  });

  test("MED-14 updates diagnosis", async () => {
    const response = await api.put(`/api/medical-records/${record._id}`).set(authHeader(token)).send({
      diagnosis: "Updated medical diagnosis",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.diagnosis).toBe("Updated medical diagnosis");
  });

  test("MED-15 deletes record as admin", async () => {
    const { appointment: removableAppointment } = await createCompletedAppointment(token);
    const create = await api.post("/api/medical-records").set(authHeader(token)).send({
      appointmentId: removableAppointment._id,
      visitSummary: "Removable summary",
      diagnosis: "Removable diagnosis",
      treatmentNotes: "Removable notes",
      recordDate: new Date().toISOString().slice(0, 10),
    });
    expect(create.status).toBe(201);

    const response = await api.delete(`/api/medical-records/${create.body.data._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
  });
});
