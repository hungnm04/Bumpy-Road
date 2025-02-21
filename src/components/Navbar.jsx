import React, { useState, useEffect } from "react";
import "./NavbarStyles.css";
import { MenuItems } from "./MenuItems";
import ProfileDropdown from "./ProfileDropdown";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import { useDebounce } from "../hooks/useDebounce"; // Add this import

const Navbar = () => {
  const [clicked, setClicked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(navbarSearchQuery, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:5000/auth-status");
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.authenticated);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:5000/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        } else {
          console.error("Failed to fetch profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const handleClickLogin = () => navigate("/login");
  const handleClickHome = () => navigate("/");

  const handleNavbarSearchChange = (e) => {
    setNavbarSearchQuery(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `http://localhost:5000/places?name=${encodeURIComponent(debouncedSearchQuery)}&limit=5`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchData();
  }, [debouncedSearchQuery]);

  const handleLogout = async () => {
    try {
      await fetchWithAuth("http://localhost:5000/logout", {
        method: "POST",
      });
      setIsAuthenticated(false);
      setProfile(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="NavbarItems">
      <h1 onClick={handleClickHome} style={{ cursor: "pointer" }}>
        Bumpy Road
      </h1>
      <ul className={clicked ? "nav-menu active" : "nav-menu"}>
        {MenuItems.map((item, index) => (
          <li key={index}>
            <Link className={item.cName} to={item.url}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="navbar-search-container">
        <div className="navbar-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search mountains..."
            value={navbarSearchQuery}
            onChange={handleNavbarSearchChange}
          />
          {isSearching && <div className="search-loader" />}
        </div>
        {searchResults.length > 0 && (
          <ul className="navbar-search-results">
            {searchResults.map((result) => (
              <li
                key={result.id}
                className="search-result-item"
                onClick={() => {
                  navigate(`/places/${result.id}`);
                  setNavbarSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <img
                  src={`src/assets/mountain_photos/${result.photo_url}`}
                  alt={result.name}
                  className="search-result-image"
                  onError={(e) => {
                    e.target.src = "/placeholder-mountain.jpg";
                  }}
                />
                <div className="search-result-info">
                  <div className="search-result-name">{result.name}</div>
                  <div className="search-result-location">{result.location}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Conditional Rendering: ProfileDropdown for authenticated users, Login button otherwise */}
      <div className="auth-container">
        {isAuthenticated ? (
          <ProfileDropdown profile={profile} onLogout={handleLogout} />
        ) : (
          <button className="auth-button" onClick={handleClickLogin}>
            Login
          </button>
        )}
      </div>
      <div className="menu-icons" onClick={() => setClicked(!clicked)}>
        <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
      </div>
    </nav>
  );
};

export default Navbar;
