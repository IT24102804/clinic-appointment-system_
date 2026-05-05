const { api, authHeader, loginAdmin } = require("./helpers/api");
const { doctorPayload } = require("./helpers/factory");

describe("Member 2 - Doctor Management module tests", () => {
  let token;
  let doctor;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
  });

  test("DOC-01 rejects create doctor without token", async () => {
    const response = await api.post("/api/doctors").send(doctorPayload());
    expect(response.status).toBe(401);
  });

  test("DOC-02 creates doctor with valid data", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload());
    expect(response.status).toBe(201);
    doctor = response.body.data;
    expect(doctor._id).toBeTruthy();
  });

  test("DOC-03 rejects empty doctor name", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({ fullName: "" }));
    expect(response.status).toBe(400);
  });

  test("DOC-04 rejects empty specialization", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({ specialization: "" }));
    expect(response.status).toBe(400);
  });

  test("DOC-05 rejects invalid phone", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({ phone: "123" }));
    expect(response.status).toBe(400);
  });

  test("DOC-06 rejects invalid email", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({ email: "bad-email" }));
    expect(response.status).toBe(400);
  });

  test("DOC-07 rejects invalid availability day", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({
      availability: [{ dayOfWeek: "monday", startTime: "08:00", endTime: "12:00" }],
    }));
    expect(response.status).toBe(400);
  });

  test("DOC-08 rejects invalid availability time format", async () => {
    const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload({
      availability: [{ dayOfWeek: "mon", startTime: "bad", endTime: "12:00" }],
    }));
    expect(response.status).toBe(400);
  });

  test("DOC-09 blocks duplicate phone or email", async () => {
    const payload = doctorPayload();
    const first = await api.post("/api/doctors").set(authHeader(token)).send(payload);
    expect(first.status).toBe(201);

    const duplicate = await api.post("/api/doctors").set(authHeader(token)).send(payload);
    expect(duplicate.status).toBe(409);
  });

  test("DOC-10 lists doctors", async () => {
    const response = await api.get("/api/doctors").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("DOC-11 reads doctor by valid ID", async () => {
    const response = await api.get(`/api/doctors/${doctor._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(doctor._id);
  });

  test("DOC-12 rejects invalid doctor ID", async () => {
    const response = await api.get("/api/doctors/bad-id").set(authHeader(token));
    expect(response.status).toBe(400);
  });

  test("DOC-13 updates doctor room", async () => {
    const response = await api.put(`/api/doctors/${doctor._id}`).set(authHeader(token)).send({ room: "Room 202" });
    expect(response.status).toBe(200);
    expect(response.body.data.room).toBe("Room 202");
  });

  test("DOC-14 updates availability status", async () => {
    const response = await api.put(`/api/doctors/${doctor._id}`).set(authHeader(token)).send({ availabilityStatus: "on_leave" });
    expect(response.status).toBe(200);
    expect(response.body.data.availabilityStatus).toBe("on_leave");
  });

  test("DOC-15 deletes unused doctor", async () => {
    const removable = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload());
    expect(removable.status).toBe(201);

    const response = await api.delete(`/api/doctors/${removable.body.data._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
  });
});
