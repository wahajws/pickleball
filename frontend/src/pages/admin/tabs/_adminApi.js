import { API_BASE_URL } from "../../../config/api";

export const getAuthToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");
  if (direct) return direct;

  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.token) return auth.token;
    if (auth?.accessToken) return auth.accessToken;
  } catch {}

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token) return user.token;
    if (user?.accessToken) return user.accessToken;
  } catch {}

  return null;
};

export const adminFetch = async (path, { method = "GET", body } = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.message || json?.error?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
};
