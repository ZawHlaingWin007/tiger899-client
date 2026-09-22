/**
 * Get user-facing error message from a failed API request.
 * Checks: description, message, errors (first key's first value), then error.message.
 * Use for showing in dialogs/toasts/error boxes.
 *
 * @param {Error} error - Axios error or similar (error.response?.data)
 * @returns {string}
 */
export function getApiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || "";
  if (typeof data.description === "string" && data.description.trim()) return data.description.trim();
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (data.errors && typeof data.errors === "object") {
    const firstKey = Object.keys(data.errors)[0];
    const firstMsg = firstKey && Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : data.errors[firstKey];
    if (firstMsg) return typeof firstMsg === "string" ? firstMsg.trim() : String(firstMsg).trim();
  }
  return data.message || data.description || error?.message || "";
}
