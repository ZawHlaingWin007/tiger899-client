import axios from "axios";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * GET /user/referral (axios baseURL already includes /api/)
 * @returns {Promise<object|null>}
 */
export async function getReferral() {
  const { data } = await axios.get("/user/referral", {
    headers: authHeaders(),
  });
  if (data?.status === "success" && data?.data != null) return data.data;
  return null;
}

/**
 * GET /user/referral/bonus-summary
 * @returns {Promise<object|null>}
 */
export async function getReferralBonusSummary() {
  const { data } = await axios.get("/user/referral/bonus-summary", {
    headers: authHeaders(),
  });
  if (data?.status === "success" && data?.data != null) return data.data;
  return null;
}

/**
 * GET /user/referral/bonus-by-date?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * @param {{ from_date: string, to_date: string }} params
 * @returns {Promise<object|null>}
 */
export async function getReferralBonusByDate(params) {
  const { data } = await axios.get("/user/referral/bonus-by-date", {
    params,
    headers: authHeaders(),
  });
  if (data?.status === "success" && data?.data != null) return data.data;
  return null;
}
