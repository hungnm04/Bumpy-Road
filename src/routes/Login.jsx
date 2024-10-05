import React, { useState } from "react";
import "./LoginStyles.css";
import { Link, useNavigate } from "react-router-dom"; 
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;
    const newErrors = { username: "", password: "" };
    if (!username) {
      newErrors.username = "Please enter your email or username";
      isValid = false;
    }
    if (!password) {
      newErrors.password = "Please enter your password";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setBackendError("");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, staySignedIn }),
      });

      const result = await response.json();
      console.log("Login response:", result);
  
      if (!response.ok) {
        setBackendError(result.message || "An error occurred. Please try again.");
      } else {
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", result.role);
  
        if (result.role === 'admin') {
          navigate("/admindashboard");
        } else if (result.role === 'guest') {
          navigate("/authenticated-home");
        } else {
          setBackendError("Unknown user role. Please contact support.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setBackendError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Handle Google Sign-In
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-header">Welcome Back!</h2>
        {backendError && <div className="error">{backendError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email or Username"
              required
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {errors.password && (
              <span className="error">{errors.password}</span>
            )}
          </div>
          <div className="stay-signed-in">
            <input
              type="checkbox"
              checked={staySignedIn}
              onChange={() => setStaySignedIn(!staySignedIn)}
            />
            <label>Stay signed in</label>
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="button-group">
          <button onClick={handleGoogleSignIn} className="google-button">
            <FaGoogle className="google-icon" />
            Sign in with Google
          </button>
          <div className="additional-options">
            <Link to="/create-account" className="secondary-button">
              Create free account
            </Link>
          </div>
        </div>
        <button
          onClick={() => alert("Forgot password clicked")}
          className="secondary-button"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
};

export default Login;
