const { api, authHeader, loginAdmin } = require("./helpers/api");
const { createCompletedAppointment } = require("./helpers/factory");

describe("Member 5 - Billing Management module tests", () => {
  let token;
  let patient;
  let appointment;
  let bill;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
    ({ patient, appointment } = await createCompletedAppointment(token));
  });

  test("BIL-01 rejects billing list without token", async () => {
    const response = await api.get("/api/billing");
    expect(response.status).toBe(401);
  });

  test("BIL-02 creates bill for completed appointment", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      paymentStatus: "pending",
      notes: "Automated billing test",
    });
    expect(response.status).toBe(201);
    bill = response.body.data;
    expect(bill._id).toBeTruthy();
  });

  test("BIL-03 rejects invalid appointment ID", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: "bad",
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("BIL-04 rejects negative amount", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: -5,
      billDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(400);
  });

  test("BIL-05 rejects invalid bill date", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: "bad-date",
    });
    expect(response.status).toBe(400);
  });

  test("BIL-06 rejects invalid payment method", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cheque",
    });
    expect(response.status).toBe(400);
  });

  test("BIL-07 rejects invalid payment status", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "unknown",
    });
    expect(response.status).toBe(400);
  });

  test("BIL-08 blocks duplicate bill for appointment", async () => {
    const response = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: appointment._id,
      amount: 2500,
      billDate: new Date().toISOString().slice(0, 10),
    });
    expect(response.status).toBe(409);
  });

  test("BIL-09 lists bills", async () => {
    const response = await api.get("/api/billing").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("BIL-10 filters bills by patient", async () => {
    const response = await api.get("/api/billing").query({ patientId: patient._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("BIL-11 filters bills by appointment", async () => {
    const response = await api.get("/api/billing").query({ appointmentId: appointment._id }).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("BIL-12 reads bill by valid ID", async () => {
    const response = await api.get(`/api/billing/${bill._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(bill._id);
  });

  test("BIL-13 updates payment status to paid", async () => {
    const response = await api.put(`/api/billing/${bill._id}`).set(authHeader(token)).send({ paymentStatus: "paid" });
    expect(response.status).toBe(200);
    expect(response.body.data.paymentStatus).toBe("paid");
  });

  test("BIL-14 updates bill notes", async () => {
    const response = await api.put(`/api/billing/${bill._id}`).set(authHeader(token)).send({ notes: "Updated billing notes" });
    expect(response.status).toBe(200);
    expect(response.body.data.notes).toBe("Updated billing notes");
  });

  test("BIL-15 deletes bill", async () => {
    const { appointment: removableAppointment } = await createCompletedAppointment(token);
    const create = await api.post("/api/billing").set(authHeader(token)).send({
      appointmentId: removableAppointment._id,
      amount: 1000,
      billDate: new Date().toISOString().slice(0, 10),
    });
    expect(create.status).toBe(201);

    const response = await api.delete(`/api/billing/${create.body.data._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
  });
});
