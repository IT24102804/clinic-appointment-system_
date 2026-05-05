const { api, authHeader, loginAdmin, unique } = require("./helpers/api");
const { patientPayload } = require("./helpers/factory");

describe("Member 1 - Patient Management module tests", () => {
  let token;
  let patient;
  let selfPatientToken;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
  });

  test("PAT-01 rejects create patient without token", async () => {
    const response = await api.post("/api/patients").send(patientPayload());
    expect(response.status).toBe(401);
  });

  test("PAT-02 creates patient with valid data", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload());
    expect(response.status).toBe(201);
    patient = response.body.data;
    expect(patient._id).toBeTruthy();
  });

  test("PAT-03 rejects empty full name", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload({ fullName: "" }));
    expect(response.status).toBe(400);
  });

  test("PAT-04 rejects invalid gender", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload({ gender: "unknown" }));
    expect(response.status).toBe(400);
  });

  test("PAT-05 rejects invalid phone", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload({ phone: "123" }));
    expect(response.status).toBe(400);
  });

  test("PAT-06 rejects invalid NIC", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload({ nic: "ABC123" }));
    expect(response.status).toBe(400);
  });

  test("PAT-07 rejects invalid date of birth", async () => {
    const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload({ dateOfBirth: "bad-date" }));
    expect(response.status).toBe(400);
  });

  test("PAT-08 blocks duplicate phone, NIC, or email", async () => {
    const payload = patientPayload();
    const first = await api.post("/api/patients").set(authHeader(token)).send(payload);
    expect(first.status).toBe(201);

    const duplicate = await api.post("/api/patients").set(authHeader(token)).send(payload);
    expect(duplicate.status).toBe(409);
  });

  test("PAT-09 lists patients with valid token", async () => {
    const response = await api.get("/api/patients").set(authHeader(token));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("PAT-10 reads patient by valid ID", async () => {
    const response = await api.get(`/api/patients/${patient._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(patient._id);
  });

  test("PAT-11 rejects invalid patient ID", async () => {
    const response = await api.get("/api/patients/bad-id").set(authHeader(token));
    expect(response.status).toBe(400);
  });

  test("PAT-12 updates patient address", async () => {
    const response = await api.put(`/api/patients/${patient._id}`).set(authHeader(token)).send({
      address: "Updated patient address",
    });
    expect(response.status).toBe(200);
    expect(response.body.data.address).toBe("Updated patient address");
  });

  test("PAT-13 rejects invalid update data", async () => {
    const response = await api.put(`/api/patients/${patient._id}`).set(authHeader(token)).send({
      gender: "wrong",
    });
    expect(response.status).toBe(400);
  });

  test("PAT-14 deactivates patient as admin", async () => {
    const removable = await api.post("/api/patients").set(authHeader(token)).send(patientPayload());
    expect(removable.status).toBe(201);

    const response = await api.delete(`/api/patients/${removable.body.data._id}`).set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("inactive");
  });

  test("PAT-15 lets patient update own profile", async () => {
    const suffix = unique("");
    const register = await api.post("/api/auth/register-patient").send({
      fullName: `Self Service Patient ${suffix}`,
      email: `selfpatient${suffix}@example.com`,
      password: "Patient@1234",
      gender: "female",
      phone: `076${String(suffix).slice(-7).padStart(7, "0")}`,
      nic: `2001${String(suffix).slice(-8).padStart(8, "0")}`,
      dateOfBirth: "2001-06-20",
      address: "No. 25, Patient Road, Colombo",
      emergencyContact: {
        name: "Initial Emergency Contact",
        phone: "0771234567",
        relationship: "Father",
      },
    });
    expect(register.status).toBe(201);
    selfPatientToken = register.body.data.accessToken || register.body.data.token;

    const response = await api.put("/api/patients/me").set(authHeader(selfPatientToken)).send({
      address: "Updated patient self-service address",
      additionalAddresses: [
        {
          label: "Office",
          address: "No. 40, Office Road, Colombo",
        },
      ],
      emergencyContact: {
        name: "Updated Emergency Contact",
        phone: "0777654321",
        relationship: "Mother",
      },
    });
    expect(response.status).toBe(200);
    expect(response.body.data.address).toBe("Updated patient self-service address");
    expect(response.body.data.additionalAddresses).toHaveLength(1);
    expect(response.body.data.emergencyContact.name).toBe("Updated Emergency Contact");
  });

  test("PAT-16 lets patient delete own additional address", async () => {
    const response = await api.delete("/api/patients/me/additional-addresses/0").set(authHeader(selfPatientToken));
    expect(response.status).toBe(200);
    expect(response.body.data.additionalAddresses).toHaveLength(0);
  });

  test("PAT-17 lets patient delete own emergency contact", async () => {
    const response = await api.delete("/api/patients/me/emergency-contact").set(authHeader(selfPatientToken));
    expect(response.status).toBe(200);
    expect(response.body.data.emergencyContact.name).toBe("");
    expect(response.body.data.emergencyContact.phone).toBe("");
    expect(response.body.data.emergencyContact.relationship).toBe("");
  });
});
