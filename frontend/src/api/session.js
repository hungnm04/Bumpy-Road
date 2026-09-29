import { fetchWithAuth } from "./fetchWithAuth";

export async function getSession() {
  const response = await fetchWithAuth("/auth-status");

  if (!response.ok) {
    return { authenticated: false, user: null };
  }

  const data = await response.json();

  return {
    authenticated: Boolean(data.authenticated),
    user: data.authenticated ? data.user || null : null,
  };
}
