import React, { useState, useEffect } from "react";
import "./NavbarStyles.css";
import { MenuItems } from "./MenuItems";
import ProfileDropdown from "./ProfileDropdown";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from 'react-icons/fa';

const Navbar = () => {
  const [clicked, setClicked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleClickLogin = () => {
    navigate("/login");
  };

  const handleClickHome = () => {
    navigate("/");
  };

  const handleNavbarSearchChange = (e) => {
    setNavbarSearchQuery(e.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!navbarSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/places?name=${encodeURIComponent(navbarSearchQuery)}`
        );
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSearchResults([]);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [navbarSearchQuery]);

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
            placeholder="Search..."
            value={navbarSearchQuery}
            onChange={handleNavbarSearchChange}
          />
        </div>
        {searchResults.length > 0 && (
          <ul className="navbar-search-results">
            {searchResults.map((result) => (
              <li key={result.id} onClick={() => navigate(`/places/${result.id}`)}>
                {result.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isAuthenticated ? (
        <ProfileDropdown />
      ) : (
        <button className="auth-button" onClick={handleClickLogin}>
          Login
        </button>
      )}
      <div className="menu-icons" onClick={() => setClicked(!clicked)}>
        <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
      </div>
    </nav>
  );
};

export default Navbar;