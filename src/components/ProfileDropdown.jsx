// src/components/ProfileDropdown.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./ProfileDropdownStyles.css";

const ProfileDropdown = ({ profile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div
        className="profile-dropdown-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        {profile?.avatar_url ? (
          <img
            src={
              profile.avatar_url.startsWith("http")
                ? profile.avatar_url
                : `http://localhost:5000${profile.avatar_url}`
            }
            alt="Profile"
            className="profile-dropdown-avatar"
          />
        ) : (
          <FaUserCircle className="profile-dropdown-icon" />
        )}
      </div>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <Link to="/profile" className="dropdown-item">
            Profile
          </Link>
          <button onClick={onLogout} className="dropdown-item">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
