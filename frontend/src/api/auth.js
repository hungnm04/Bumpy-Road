import api from "./index";

const authAPI = {
  login: async (username, password) => api.post("/login", { username, password }),
  register: async (account) => api.post("/create-account", account),
  logout: async () => api.post("/logout"),
  checkAuthStatus: async () => api.get("/auth-status"),
  refreshToken: async () => api.post("/refresh-token"),
};

export default authAPI;
