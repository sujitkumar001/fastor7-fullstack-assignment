import { apiRequest, ApiError } from "./fastorApi.js";

function formBody(fields) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(fields)) {
    params.set(key, String(value));
  }

  return params;
}

function normalizePhone(phone) {
  const normalized = String(phone).trim().replace(/[\s()-]/g, "");

  if (!/^\d{10}$/.test(normalized)) {
    throw new Error("Enter a valid 10-digit mobile number.");
  }

  return normalized;
}

async function formRequest(path, fields) {
  const baseUrl = (
    import.meta.env.VITE_FASTOR_API_BASE_URL ||
    "https://staging.fastor.ai"
  ).replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody(fields).toString(),
  });

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text };
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || `Request failed (${response.status})`,
      response.status,
      data
    );
  }

  return data;
}

export async function requestOtp(phone) {
  return formRequest("/v1/pwa/user/register", {
    phone: normalizePhone(phone),
    dial_code: "+91",
  });
}

export async function verifyOtp(phone, otp) {
  const normalizedOtp = String(otp).trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new Error("Enter a valid 6-digit OTP.");
  }

  const response = await formRequest("/v1/pwa/user/login", {
    phone: normalizePhone(phone),
    otp: normalizedOtp,
    dial_code: "+91",
  });

  const token = response?.data?.token;

  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Login response did not contain a valid JWT token.");
  }

  return { response, token };
}

export async function fetchRestaurants(token, cityId = 118) {
  if (!token) {
    throw new Error("Login is required to fetch restaurants.");
  }

  return apiRequest(
    `/v1/m/restaurant?city_id=${encodeURIComponent(cityId)}`,
    {
      method: "GET",
      token,
    }
  );
}