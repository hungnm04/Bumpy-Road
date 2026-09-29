import React, { useState, useEffect } from "react";
import "./NavbarStyles.css";
import { MenuItems } from "./MenuItems";
import ProfileDropdown from "./ProfileDropdown";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LuLogIn, LuMenu, LuMountain, LuSearch, LuX } from "react-icons/lu";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { getMountainImageUrl } from "../api/assetUrls";
import { useDebounce } from "../hooks/useDebounce";
import { getSession } from "../api/session";

const Navbar = () => {
  const [clicked, setClicked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const debouncedSearchQuery = useDebounce(navbarSearchQuery, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(session.authenticated);
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
        const response = await fetchWithAuth("/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
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
          `/places?q=${encodeURIComponent(debouncedSearchQuery)}&limit=5`
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
      await fetchWithAuth("/logout", { method: "POST" });
      setIsAuthenticated(false);
      setProfile(null);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const closeMenu = () => setClicked(false);

  return (
    <motion.nav
      className={`NavbarItems ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.button
        className="nav-brand"
        onClick={handleClickHome}
        aria-label="Go to homepage"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="nav-brand-mark">
          <LuMountain />
        </span>
        <span>
          <strong>Bumpy Road</strong>
          <small>Mountain field guide</small>
        </span>
      </motion.button>

      <motion.ul
        className={clicked ? "nav-menu active" : "nav-menu"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {MenuItems.map((item, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Link className={item.cName} to={item.url} onClick={closeMenu}>
              {item.title}
            </Link>
          </motion.li>
        ))}
      </motion.ul>

      <div className="navbar-search-container">
        <motion.div
          className="navbar-search"
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <LuSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search mountains..."
            value={navbarSearchQuery}
            onChange={handleNavbarSearchChange}
          />
          {isSearching && <div className="search-loader" />}
        </motion.div>
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.ul
              className="navbar-search-results"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {searchResults.map((result, i) => (
                <motion.li
                  key={result.id}
                  className="search-result-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    navigate(`/places/${result.id}`);
                    setNavbarSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  {getMountainImageUrl(result.photo_url) ? (
                    <img
                      src={getMountainImageUrl(result.photo_url)}
                      alt={result.name}
                      className="search-result-image"
                    />
                  ) : (
                    <div className="search-result-image search-result-image-placeholder">Photo pending</div>
                  )}
                  <div className="search-result-info">
                    <div className="search-result-name">{result.name}</div>
                    <div className="search-result-location">{result.location}</div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="auth-container">
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileDropdown profile={profile} onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.button
              key="login"
              className="auth-button"
              onClick={handleClickLogin}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LuLogIn />
              Login
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        className="menu-icons"
        onClick={() => setClicked(!clicked)}
        aria-label={clicked ? "Close navigation" : "Open navigation"}
        aria-expanded={clicked}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={clicked ? "close" : "menu"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {clicked ? <LuX /> : <LuMenu />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </motion.nav>
  );
};

export default Navbar;
