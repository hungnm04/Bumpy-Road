// src/pages/Profile.jsx

import React, { useEffect, useState } from "react";
import ImageModal from "../components/ImageModal";
import profileAPI from "../../server/api/profile";
import "./ProfileStyles.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  const fetchProfile = async () => {
    try {
      const { profile } = await profileAPI.getProfile();
      // Ensure we have a proper username from the backend
      profile.username = profile.username || `guest${profile.id || ""}`;
      setProfile(profile);
      setEditedProfile(profile);
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
    const updatedFields = {};
    if (editedProfile.first_name !== profile.first_name)
      updatedFields.first_name = editedProfile.first_name;
    if (editedProfile.last_name !== profile.last_name)
      updatedFields.last_name = editedProfile.last_name;
    if (editedProfile.email !== profile.email)
      updatedFields.email = editedProfile.email;
    if (editedProfile.bio !== profile.bio)
      updatedFields.bio = editedProfile.bio;

    try {
      const { profile: updatedProfile } =
        await profileAPI.updateProfile(updatedFields);
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setEditMode(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast("Image size should be less than 20MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploadProgress(0);
      const data = await profileAPI.uploadAvatar(formData);
      setProfile((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      showToast("Profile picture updated successfully");
    } catch (err) {
      showToast(err.message || "Failed to update profile picture");
    } finally {
      setUploadProgress(0);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
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

  // Simplify username display logic
  const displayUsername = `@${profile?.username || "guest"}`;

  return (
    <div className="profile-container">
      <h1 className="profile-header">Profile</h1>
      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="avatar-section">
            <img
              src={
                profile?.avatar_url
                  ? `http://localhost:5000${profile.avatar_url}`
                  : "http://localhost:5000/storage/avatars/default-avatar.png"
              }
              alt="Profile"
              className="profile-avatar"
              onClick={() => setIsModalOpen(true)}
            />
            <div className="avatar-overlay">
              <label className="avatar-upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                Change Photo
              </label>
            </div>
          </div>
          <h2 className="profile-name">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="profile-username">{displayUsername}</p>
          <p className="profile-bio">{profile?.bio || "No bio yet"}</p>
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
                First Name
                <input
                  type="text"
                  name="first_name"
                  value={editedProfile.first_name || ""}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                />
              </label>
              <label>
                Last Name
                <input
                  type="text"
                  name="last_name"
                  value={editedProfile.last_name || ""}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email || ""}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </label>
              <label>
                Bio
                <textarea
                  name="bio"
                  value={editedProfile.bio || ""}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </label>
              <div className="buttons-container">
                <button onClick={handleSubmit} className="submit-button">
                  Save Changes
                </button>
                <button onClick={handleCancelEdit} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <h2>Profile Information</h2>
              <p>
                <strong>Full Name:</strong> {profile?.first_name}{" "}
                {profile?.last_name}
              </p>
              <p>
                <strong>Username:</strong> {displayUsername}
              </p>
              <p>
                <strong>Email:</strong> {profile?.email || "Not provided"}
              </p>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <ImageModal
          imageUrl={profile?.avatar_url || "https://i.pravatar.cc/300"}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {uploadProgress > 0 && (
        <div className="avatar-upload-progress">
          <div
            className="avatar-upload-progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastMessage ? "show" : ""}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Profile;
