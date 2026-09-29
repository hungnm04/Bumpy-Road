import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FALLBACK_MOUNTAIN_IMAGE, getMountainImageUrl } from "../api/assetUrls";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./BlogPageStyles.css";
import { LuArrowUpRight, LuPlus, LuScrollText } from "react-icons/lu";
import { getSession } from "../api/session";

function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blog', {  // Changed from /blog to /api/blog
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data); // Debug log
        setBlogs(data.blogs || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(session.authenticated);
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, []);

  // Early return for loading and error states
  if (loading) return (
    <>
      <Navbar />
      <div className="blog-container">
        <div className="loading">Loading blogs...</div>
      </div>
      <Footer />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="blog-container">
        <div className="error-message">{error}</div>
      </div>
      <Footer />
    </>
  );

  // Return the main content only if we have data
  return (
    <>
      <Navbar />
      <div className="blog-container">
        <div className="blog-header">
          <div className="blog-header-content">
            <p className="eyebrow">Trail journal</p>
            <h1>Adventure stories with useful edges.</h1>
            <p>Read the route notes, lessons, gear calls, and near-misses that make a mountain easier to understand before you go.</p>
          </div>
          <div className="blog-actions">
            {isAuthenticated && (
              <Link to="/blog/create" className="create-blog-button">
                <LuPlus />
                <span className="button-text">Create Story</span>
              </Link>
            )}
          </div>
        </div>

        <div className="blog-grid">
          {blogs && blogs.length > 0 ? (
            blogs.map((blog) => (
              <Link 
                to={`/blog/${blog.id}`} 
                key={blog.id} 
                className="blog-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/blog/${blog.id}`);
                }}
              >
                <article className="blog-card">
                  <div className="blog-image">
                    <img
                      src={getMountainImageUrl(blog.image_url)}
                      alt={blog.title}
                      onError={(e) => {
                        e.target.src = FALLBACK_MOUNTAIN_IMAGE;
                      }}
                    />
                    <div className="blog-category">{blog.category}</div>
                  </div>
                  <div className="blog-content">
                    <div className="blog-meta">
                      <LuScrollText />
                      <span className="blog-date">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h2>{blog.title}</h2>
                    <p>{blog.content.substring(0, 120)}...</p>
                    <div className="blog-footer">
                      <span className="read-more">Read More <LuArrowUpRight /></span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="no-blogs">No blog posts found.</div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default BlogPage;
