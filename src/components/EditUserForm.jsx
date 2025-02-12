import React, { useState, useEffect } from "react";
import "./EditUserForm.css";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";

const EditUserForm = ({ userId, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchWithAuth(
          `http://localhost:5000/admin/users/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const data = await response.json();
        if (data.success) {
          setFormData({
            username: data.user.username || "",
            email: data.user.email || "",
            first_name: data.user.first_name || "",
          });
        } else {
          throw new Error(data.message || "Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(error.message || "Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate password if being changed
      if (passwordChangeMode) {
        if (formData.new_password !== formData.confirm_password) {
          throw new Error("Passwords do not match");
        }
        if (formData.new_password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }
      }

      // Create submission data without empty fields
      const submissionData = Object.entries(formData).reduce(
        (acc, [key, value]) => {
          if (value && key !== "confirm_password") {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      const response = await fetchWithAuth(
        `http://localhost:5000/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      onUserUpdated();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="edit-user-modal">
      <div className="edit-user-content">
        <h2>Edit User</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter new username (optional)"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter new email (optional)"
            />
          </div>

          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter new first name (optional)"
            />
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter new last name (optional)"
            />
          </div>

          <div className="password-section">
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setPasswordChangeMode(!passwordChangeMode)}
            >
              {passwordChangeMode
                ? "Cancel Password Change"
                : "Change Password"}
            </button>

            {passwordChangeMode && (
              <>
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;
