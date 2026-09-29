import apiConfig from "./config";

async function parseError(response) {
  try {
    const error = await response.json();
    return error.message || "API call failed";
  } catch {
    return "API call failed";
  }
}

const api = {
  async get(endpoint) {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      credentials: apiConfig.CREDENTIALS,
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "POST",
      headers: apiConfig.HEADERS,
      credentials: apiConfig.CREDENTIALS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  },

  async put(endpoint, data) {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: apiConfig.HEADERS,
      credentials: apiConfig.CREDENTIALS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  },

  async upload(endpoint, formData) {
    const response = await fetch(`${apiConfig.BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: apiConfig.CREDENTIALS,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  },
};

export default api;
