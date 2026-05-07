const { api, authHeader, nextWeekdayDate, unique } = require("./api");

function patientPayload(overrides = {}) {
  const suffix = unique("");
  return {
    fullName: `Test Patient ${suffix}`,
    age: 30,
    gender: "female",
    phone: `071${String(suffix).slice(-7).padStart(7, "0")}`,
    nic: `1999${String(suffix).slice(-8).padStart(8, "0")}`,
    dateOfBirth: "1996-05-15",
    email: `patient${suffix}@example.com`,
    password: "Patient@1234",
    address: "No. 10, Test Road, Colombo",
    status: "active",
    ...overrides,
  };
}

function doctorPayload(overrides = {}) {
  const suffix = unique("");
  return {
    fullName: `Dr. Test Doctor ${suffix}`,
    specialization: "General Medicine",
    phone: `072${String(suffix).slice(-7).padStart(7, "0")}`,
    email: `doctor${suffix}@example.com`,
    room: "Room 101",
    experienceYears: 8,
    sessionFee: 2500,
    availability: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((dayOfWeek) => ({
      dayOfWeek,
      startTime: "08:00",
      endTime: "14:00",
    })),
    availabilityStatus: "available",
    status: "active",
    ...overrides,
  };
}

async function createPatient(token, overrides) {
  const response = await api.post("/api/patients").set(authHeader(token)).send(patientPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.data;
}

async function createDoctor(token, overrides) {
  const response = await api.post("/api/doctors").set(authHeader(token)).send(doctorPayload(overrides));
  expect(response.status).toBe(201);
  return response.body.data;
}

async function createAppointment(token, patientId, doctorId, overrides = {}) {
  const response = await api
    .post("/api/appointments")
    .set(authHeader(token))
    .send({
      patientId,
      doctorId,
      appointmentDate: nextWeekdayDate(1),
      timeSlot: "09:30 AM",
      reason: "Automated test appointment",
      status: "confirmed",
      ...overrides,
    });


    if (response.status !== 201) {
  console.log("Create appointment failed:", response.status, response.body);
}


  expect(response.status).toBe(201);
  return response.body.data;
}

async function createCompletedAppointment(token) {
  const patient = await createPatient(token);
  const doctor = await createDoctor(token);
  const appointment = await createAppointment(token, patient._id, doctor._id, {
    status: "completed",
  });
  return { patient, doctor, appointment };
}

function medicinePayload(overrides = {}) {
  return {
    name: "Paracetamol",
    dosage: "500mg",
    frequency: "Twice daily",
    duration: "5 days",
    instructions: "Take after meals",
    ...overrides,
  };
}

module.exports = {
  createAppointment,
  createCompletedAppointment,
  createDoctor,
  createPatient,
  doctorPayload,
  medicinePayload,
  patientPayload,
};
