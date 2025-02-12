import apiConfig from "./config";

const api = {
  get: async (endpoint) => {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      credentials: apiConfig.CREDENTIALS,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API call failed");
    }
    return response.json();
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: apiConfig.HEADERS,
      credentials: apiConfig.CREDENTIALS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API call failed");
    }
    return response.json();
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: apiConfig.HEADERS,
      credentials: apiConfig.CREDENTIALS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API call failed");
    }
    return response.json();
  },

  upload: async (endpoint, formData) => {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: apiConfig.CREDENTIALS,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "API call failed");
    }
    return response.json();
  },
};

export default api;
