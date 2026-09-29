export async function fetchWithAuth(url, options = {}) {
  const requestOptions = {
    credentials: "include",
    ...options,
  };

  let response = await fetch(url, requestOptions);

  if (response.status === 401) {
    try {
      const refreshResponse = await fetch("/refresh-token", {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        response = await fetch(url, requestOptions);
      } else if (!url.endsWith("/auth-status")) {
        throw new Error("Session expired. Please log in again.");
      }
    } catch (error) {
      if (!url.endsWith("/auth-status")) {
        throw error;
      }
    }
  }

  return response;
}
