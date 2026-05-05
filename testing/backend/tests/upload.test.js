const fs = require("fs");
const path = require("path");
const { api, authHeader, loginAdmin } = require("./helpers/api");
const { createPatient } = require("./helpers/factory");

describe("Cloudinary/file upload testing", () => {
  let token;
  let patient;

  beforeAll(async () => {
    ({ token } = await loginAdmin());
    patient = await createPatient(token);
  });

  test("rejects missing attachment file", async () => {
    const response = await api.post(`/api/patients/${patient._id}/attachment`).set(authHeader(token));
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("An attachment file is required.");
  });

  test("rejects invalid attachment type", async () => {
    const filePath = path.join(__dirname, "fixtures", "invalid.txt");
    const response = await api
      .post(`/api/patients/${patient._id}/attachment`)
      .set(authHeader(token))
      .attach("attachment", filePath);
    expect(response.status).toBe(400);
  });

  test("uploads and deletes valid PDF attachment", async () => {
    const filePath = path.join(__dirname, "fixtures", "sample.pdf");
    const upload = await api
      .post(`/api/patients/${patient._id}/attachment`)
      .set(authHeader(token))
      .attach("attachment", filePath);
    expect(upload.status).toBe(200);
    expect(upload.body.data.attachmentUrl).toBeTruthy();

    const remove = await api.delete(`/api/patients/${patient._id}/attachment`).set(authHeader(token));
    expect(remove.status).toBe(200);
    expect(remove.body.data.attachmentUrl).toBe("");
  });

  test("rejects attachment over 5MB", async () => {
    const tempDir = path.join(__dirname, "tmp");
    fs.mkdirSync(tempDir, { recursive: true });
    const largeFile = path.join(tempDir, "large.pdf");
    fs.writeFileSync(largeFile, Buffer.alloc(5 * 1024 * 1024 + 1));

    const response = await api
      .post(`/api/patients/${patient._id}/attachment`)
      .set(authHeader(token))
      .attach("attachment", largeFile);
    expect(response.status).toBe(413);
  });
});
