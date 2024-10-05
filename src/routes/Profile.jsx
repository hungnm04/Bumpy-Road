import React, { useEffect, useState } from "react";
import "./ProfileStyles.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setProfile(data);
      setEditedProfile(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditProfile = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

    const handleSubmit = async () => {
      const token = localStorage.getItem("token");
    
      if (!token) {
        setError("No token found. Please log in.");
        return;
      }
    
      const updatedFields = {};
      if (editedProfile.first_name !== profile.first_name) updatedFields.first_name = editedProfile.first_name;
      if (editedProfile.last_name !== profile.last_name) updatedFields.last_name = editedProfile.last_name;
      if (editedProfile.email !== profile.email) updatedFields.email = editedProfile.email;
      if (editedProfile.bio !== profile.bio) updatedFields.bio = editedProfile.bio;
    
      try {
        const response = await fetch("http://localhost:5000/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedFields),
        });
    
        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            errorData = { message: "Failed to update profile data" };
          }
          throw new Error(errorData.message || "Failed to update profile data");
        }
    
        const updatedProfile = await response.json();
    
        setProfile(updatedProfile);
        setEditedProfile(updatedProfile);
        setEditMode(false);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  if (error) {
    return <div className="profile-container error">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="profile-container">No profile data available.</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="profile-header">Profile</h1>
      <div className="profile-layout">
        <div className="profile-sidebar">
          <img 
            src={profile.avatar_url || "https://github.com/github.png"} 
            alt="Profile" 
            className="profile-avatar"
          />
          <h1 className="profile-name">{profile.first_name} {profile.last_name}</h1>
          <p className="profile-username">{profile.username}</p>
          <p className="profile-bio">{profile.bio}</p>
          {!editMode && (
            <button className="profile-edit-button" onClick={handleEditProfile}>
              Edit Profile
            </button>
          )}
        </div>
        <div className="profile-main">
          {editMode ? (
            <div className="profile-details edit-form">
              <h2>Edit Profile</h2>
              <label>
                First Name:
                <input
                  type="text"
                  name="first_name"
                  value={editedProfile.first_name || ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  name="last_name"
                  value={editedProfile.last_name || ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email || ""}
                  onChange={handleChange}
                />
              </label>
              <label>
                Bio:
                <textarea
                  name="bio"
                  value={editedProfile.bio || ""}
                  onChange={handleChange}
                />
              </label>
              <div className="buttons-container">
                <button onClick={handleSubmit}>Update</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <h2>Profile Details</h2>
              <p><strong>First Name:</strong> {profile.first_name || "Not provided"}</p>
              <p><strong>Last Name:</strong> {profile.last_name || "Not provided"}</p>
              <p><strong>Email:</strong> {profile.email || "Not provided"}</p>
              <p><strong>Bio:</strong> {profile.bio || "Not provided"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;