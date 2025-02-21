import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./BlogPageStyles.css";

function CreateBlog() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Adventure",
    image_url: "",
  });
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const categories = [
    "Adventure",
    "Travel Guide",
    "Safety",
    "Equipment",
    "Tips",
    "Experience",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth("http://localhost:5000/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog post");
      }

      navigate("/blog");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      image_url: url
    }));
    setImagePreview(url);
  };

  return (
    <>
      <Navbar />
      <div className="create-blog-container">
        <h1>Create New Blog Post</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="create-blog-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image_url">Image URL</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleImageUrlChange}
              placeholder="Enter image URL"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className={`image-preview ${imagePreview ? 'show' : ''}`}
                onError={(e) => {
                  e.target.src = "/src/assets/mountain_photos/placeholder-mountain.png";
                }}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows="10"
            />
          </div>

          <button type="submit" className="submit-button">
            Create Post
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default CreateBlog;
