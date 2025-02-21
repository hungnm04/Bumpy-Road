import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./BlogPageStyles.css";

function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          <h1>Adventure Stories</h1>
          <p>Explore mountain experiences and expert insights</p>
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
                      src={`/src/assets/mountain_photos/${blog.image_url}`}
                      alt={blog.title}
                      onError={(e) => {
                        e.target.src = "/src/assets/mountain_photos/placeholder-mountain.png";
                      }}
                    />
                    <div className="blog-category">{blog.category}</div>
                  </div>
                  <div className="blog-content">
                    <h2>{blog.title}</h2>
                    <p>{blog.content.substring(0, 120)}...</p>
                    <div className="blog-footer">
                      <div className="blog-meta">
                        <span className="blog-date">
                          {new Date(blog.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="read-more">Read More →</span>
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
