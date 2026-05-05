const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
const FormData = require("form-data");

const BASE_URL = process.env.BASE_URL || "https://clinic-appointment-system-ji86.onrender.com";

function normalizePath(requestPath) {
  if (requestPath.startsWith("http://") || requestPath.startsWith("https://")) {
    return requestPath;
  }

  return `${BASE_URL}${requestPath.startsWith("/") ? requestPath : `/${requestPath}`}`;
}

function toTestResponse(response) {
  return {
    status: response.status,
    body: response.data,
    headers: response.headers,
  };
}

class AxiosRequestBuilder {
  constructor(method, requestPath) {
    this.method = method;
    this.requestPath = requestPath;
    this.headers = {};
    this.params = {};
    this.payload = undefined;
    this.formData = null;
  }

  set(headers) {
    Object.assign(this.headers, headers);
    return this;
  }

  query(params) {
    Object.assign(this.params, params);
    return this;
  }

  send(payload) {
    this.payload = payload;
    return this;
  }

  attach(fieldName, filePath) {
    if (!this.formData) {
      this.formData = new FormData();
    }

    this.formData.append(fieldName, fs.createReadStream(filePath), {
      filename: path.basename(filePath),
    });
    return this;
  }

  async execute() {
    const body = this.formData || this.payload;
    const headers = {
      ...this.headers,
      ...(this.formData ? this.formData.getHeaders() : {}),
    };

    try {
      const response = await axios({
        method: this.method,
        url: normalizePath(this.requestPath),
        data: body,
        params: this.params,
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true,
      });

      return toTestResponse(response);
    } catch (error) {
      if (error.response) {
        return toTestResponse(error.response);
      }

      throw new Error(`Could not reach API at ${normalizePath(this.requestPath)}. Start the backend first or check BASE_URL in .env.test. Original error: ${error.message}`);
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

const api = {
  get(requestPath) {
    return new AxiosRequestBuilder("get", requestPath);
  },
  post(requestPath) {
    return new AxiosRequestBuilder("post", requestPath);
  },
  put(requestPath) {
    return new AxiosRequestBuilder("put", requestPath);
  },
  delete(requestPath) {
    return new AxiosRequestBuilder("delete", requestPath);
  },
};

function expectEnvelope(response) {
  expect(response.body).toHaveProperty("success");
  expect(response.body).toHaveProperty("message");
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginAdmin() {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in testing/backend/.env.test before running protected tests.");
  }

  const response = await api.post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  expectEnvelope(response);
  const token = response.body.data.accessToken || response.body.data.token;
  expect(token).toBeTruthy();
  return { token, user: response.body.data.user, refreshToken: response.body.data.refreshToken };
}

function unique(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function nextWeekdayDate(targetDayIndex) {
  const date = new Date();
  const diff = (targetDayIndex + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  api,
  authHeader,
  expectEnvelope,
  loginAdmin,
  nextWeekdayDate,
  unique,
};
