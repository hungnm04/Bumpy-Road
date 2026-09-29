import api from "./index";

const profileAPI = {
  getProfile: async () => api.get("/profile"),
  updateProfile: async (profileData) => api.put("/profile", profileData),
  uploadAvatar: async (formData) => api.upload("/upload-avatar", formData),
};

export default profileAPI;
