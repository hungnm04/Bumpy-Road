import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authAPI from "../../server/api/auth";
import "./LoginStyles.css";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await authAPI.login(username, password);
      if (result.user.role === "admin") {
        navigate("/admindashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setBackendError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="additional-options">
          <Link to="/create-account" className="secondary-button">
            Create free account
          </Link>
        </div>
        <button className="secondary-button">Forgot password?</button>
      </div>
    </div>
  );
};

export default Login;
