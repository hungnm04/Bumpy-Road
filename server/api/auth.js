import api from "./index";

const authAPI = {
  login: async (username, password) => {
    return api.post("/login", { username, password });
  },

  logout: async () => {
    return api.post("/logout");
  },

  checkAuthStatus: async () => {
    return api.get("/auth-status");
  },

  refreshToken: async () => {
    return api.post("/refresh-token");
  },
};

export default authAPI;
