import React, { useState } from "react";
import "./CreateAccountStyles.css";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowRight, LuMountain, LuUserPlus } from "react-icons/lu";
import authAPI from "../api/auth";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;
    const newErrors = {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    };
    if (!email) {
      newErrors.email = "Please enter an email address";
      isValid = false;
    }
    if (!username) {
      newErrors.username = "Please enter a username";
      isValid = false;
    }
    if (!password) {
      newErrors.password = "Please enter a password";
      isValid = false;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setErrors(newErrors);
    setBackendError("");
    setIsLoading(true);

    try {
      await authAPI.register({ email, username, password });
      navigate("/login", {
        replace: true,
        state: { notice: "Account created. Sign in to continue." },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      setBackendError(error.message || "An error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-account-container">
      <Link to="/" className="auth-home-link">
        <LuMountain />
        Bumpy Road
      </Link>
      <div className="create-account-box">
        <p className="eyebrow">Join the field guide</p>
        <h2 className="create-account-header">Start collecting your mountain notes.</h2>
        <p className="auth-copy">Create a profile to publish stories, leave reviews, and make Bumpy Road more useful for the next traveler.</p>
        {backendError && <div className="error auth-form-error">{backendError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
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
          <div className="input-group">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Creating account..." : <><LuUserPlus /> Create Account</>}
          </button>
        </form>
        <div className="login-link">
          Already have an account? <Link to="/login">Login here <LuArrowRight /></Link>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
