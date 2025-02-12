import api from "./index";

const profileAPI = {
  getProfile: async () => {
    return api.get("/profile");
  },

  updateProfile: async (profileData) => {
    return api.put("/profile", profileData);
  },

  uploadAvatar: async (formData) => {
    return api.upload("/upload-avatar", formData);
  },
};

export default profileAPI;
