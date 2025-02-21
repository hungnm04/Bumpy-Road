export async function fetchWithAuth(url, options = {}) {
  const defaultOptions = {
    credentials: "include",
    ...options,
  };
  let response = await fetch(url, defaultOptions);

  if (response.status === 401) {
    try {
      const refreshResponse = await fetch("http://localhost:5000/refresh-token", {
        method: "POST",
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // Retry the original request after refreshing the token
        response = await fetch(url, defaultOptions);
      } else {
        // For auth-status, return the response without throwing
        if (url.endsWith("/auth-status")) {
          return response;
        }
        throw new Error("Session expired. Please log in again.");
      }
    } catch (error) {
      if (url.endsWith("/auth-status")) {
        return response;
      }
      throw error;
    }
  }

  return response;
}
