const API_URL = process.env.NEXT_PUBLIC_API_URL!;

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export const getRefreshToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
export const setRefreshToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem("refreshToken", t);
  else localStorage.removeItem("refreshToken");
};

export function decodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setAccessToken(data.token);
  return true;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });

  let res = await doFetch();

  if (res.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.errors ? JSON.stringify(body.errors) : body.error || body.success || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}