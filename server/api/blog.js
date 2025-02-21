import api from "./index";

const blogAPI = {
  getBlogs: async (page, category) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (category && category !== "All") params.append("category", category);
    return api.get(`/blog?${params}`);
  },

  getBlogById: async (id) => {
    return api.get(`/blog/${id}`);
  },

  createBlog: async (blogData) => {
    return api.post("/blog", blogData);
  }
};

export default blogAPI;
