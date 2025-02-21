import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./BlogPageStyles.css";

function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blog/${id}`, {  // Changed from /blog to /api/blog
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch blog details');
        }
        setBlog(data.blog);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
  }, [id]);

  if (loading) return (
    <>
      <Navbar />
      <div className="blog-detail-container">
        <div className="loading">Loading blog details...</div>
      </div>
      <Footer />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="blog-detail-container">
        <div className="error-message">{error}</div>
      </div>
      <Footer />
    </>
  );

  if (!blog) return (
    <>
      <Navbar />
      <div className="blog-detail-container">
        <div className="error-message">Blog not found</div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="blog-detail-container">
        <div className="blog-detail-hero">
          <img
            src={`/src/assets/mountain_photos/${blog.image_url}`}
            alt={blog.title}
            className="blog-detail-image"
            onError={(e) => {
              e.target.src = "/src/assets/mountain_photos/placeholder-mountain.png";
            }}
            loading="eager"
            decoding="async"
          />
          <div className="blog-detail-hero-overlay">
            <div className="blog-hero-content">
              <div className="blog-category-badge">{blog.category}</div>
              <h1 className="blog-detail-title">{blog.title}</h1>
            </div>
          </div>
        </div>

        <div className="blog-detail-content">
          <div className="blog-content-wrapper">
            <div className="blog-content-body">
              {blog.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="blog-meta-footer">
              <span className="blog-date">
                {new Date(blog.created_at).toLocaleDateString()}
              </span>
              <span className="blog-author">by {blog.author_username}</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default BlogDetail;
