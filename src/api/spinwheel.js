import axios from "axios";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * @param {import('axios').AxiosError} err
 */
export function normalizeSpinwheelError(err) {
  const res = err.response;
  if (!res) {
    return {
      status: 0,
      message: err.message || "Network error",
      errors: null,
    };
  }
  const d = res.data || {};
  const spinErr = d.errors?.spin;
  const firstSpin =
    Array.isArray(spinErr) && spinErr.length ? spinErr[0] : null;
  return {
    status: res.status,
    message: firstSpin || d.message || res.statusText || "Request failed",
    errors: d.errors || null,
  };
}

/**
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export async function getSpinWheel() {
  const { data } = await axios.get("/user/spinwheel", {
    headers: authHeaders(),
  });
  if (!data?.success) {
    const e = new Error(data?.message || "Spin wheel load failed");
    e.response = { status: 422, data };
    throw e;
  }
  return {
    data: Array.isArray(data.data) ? data.data : [],
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
  };
}

/**
 * @param {{ per_page?: number, page?: number }} params
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export async function getSpinWheelHistory(params = {}) {
  const { data } = await axios.get("/user/spinwheel/history", {
    headers: authHeaders(),
    params: {
      per_page: Math.min(50, Math.max(1, params.per_page ?? 10)),
      page: Math.max(1, params.page ?? 1),
    },
  });
  if (!data?.success) {
    const e = new Error(data?.message || "History load failed");
    e.response = { status: 422, data };
    throw e;
  }
  return {
    data: Array.isArray(data.data) ? data.data : [],
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
  };
}

/**
 * @returns {Promise<{ data: object, meta: object, message?: string }>}
 */
export async function postSpinWheel() {
  const { data } = await axios.post(
    "/user/spinwheel/spin",
    {},
    { headers: authHeaders() },
  );
  if (!data?.success) {
    const e = new Error(data?.message || "Spin failed");
    e.response = { status: 422, data };
    throw e;
  }
  return {
    data: data.data || {},
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
    message: data.message,
  };
}
