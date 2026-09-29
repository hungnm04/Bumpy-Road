import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuArrowRight,
  LuCompass,
  LuMapPin,
  LuMountain,
  LuSearch,
  LuSlidersHorizontal,
  LuSparkles,
  LuX,
} from "react-icons/lu";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getMountainImageUrl } from "../api/assetUrls";
import { useDebounce } from "../hooks/useDebounce";
import "./PlacesStyles.css";

const EMPTY_FILTERS = {
  continent: "",
  destination_type: "",
  min_elevation_m: "",
  tags: "",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function DestinationCard({ site, badge, onClick, index }) {
  const tags = [...(site.editorial_tags || []), ...(site.source_tags || [])].slice(0, 2);
  const imageUrl = getMountainImageUrl(site.photo_url);
  const statusBadge = site.guide_status === "guide_ready" ? badge : "Preview";

  return (
    <motion.button
      className="mountain-card-wrapper"
      type="button"
      onClick={onClick}
      variants={cardVariants}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <article className="mountain-card">
        <motion.div
          className="mountain-card-image"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={site.name} />
          ) : (
            <div className="mountain-photo-pending">Photo pending</div>
          )}
          {statusBadge && <div className="mountain-card-badge">{statusBadge}</div>}
        </motion.div>
        <div className="mountain-card-content">
          <div>
            <h3 className="mountain-card-title">{site.name}</h3>
            <p className="mountain-card-location">
              <LuMapPin /> {site.region || site.location}
            </p>
          </div>
          <div className="mountain-card-meta">
            {site.elevation_m && <span>{Number(site.elevation_m).toLocaleString()} m</span>}
            <span>{site.continent}</span>
            {tags.map((tag) => <span key={tag}>{tag.replace(/-/g, " ")}</span>)}
          </div>
          <motion.span
            className="mountain-card-link"
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Open field notes <LuArrowRight />
          </motion.span>
        </div>
      </article>
    </motion.button>
  );
}

function Places() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchResults, setSearchResults] = useState([]);
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const debouncedTags = useDebounce(filters.tags, 300);
  const activeFilters = useMemo(
    () => ({ ...filters, tags: debouncedTags }),
    [filters, debouncedTags]
  );
  const hasSearch = Boolean(
    debouncedQuery.trim() || Object.values(activeFilters).some((value) => String(value).trim())
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!hasSearch) {
      setSearchResults([]);
      setSearchError("");
      return () => controller.abort();
    }

    const fetchSearchResults = async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({ limit: "50" });

        if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
        Object.entries(activeFilters).forEach(([key, value]) => {
          if (String(value).trim()) params.set(key, String(value).trim());
        });

        const response = await fetch(`/places?${params}`, { signal: controller.signal });

        if (!response.ok) throw new Error("Search is temporarily unavailable.");

        setSearchResults(await response.json());
      } catch (error) {
        if (error.name !== "AbortError") {
          setSearchResults([]);
          setSearchError(error.message);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
    return () => controller.abort();
  }, [activeFilters, debouncedQuery, hasSearch]);

  useEffect(() => {
    const fetchFeaturedPlaces = async () => {
      setFeaturedLoading(true);

      try {
        const response = await fetch("/featured-places");
        if (!response.ok) throw new Error("Featured places are temporarily unavailable.");
        setFeaturedPlaces(await response.json());
      } catch {
        setFeaturedPlaces([]);
      } finally {
        setFeaturedLoading(false);
      }
    };

    fetchFeaturedPlaces();
  }, []);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearSearch = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  };

  const renderCards = (sites, badge) => (
    <motion.div
      className="mountain-card-grid"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {sites.map((site, index) => (
        <DestinationCard
          key={site.id}
          site={site}
          badge={badge}
          onClick={() => navigate(`/places/${site.id}`)}
          index={index}
        />
      ))}
    </motion.div>
  );

  return (
    <div className="places-container">
      <Navbar />
      <main className="places-content">
        <motion.section
          className="places-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="eyebrow">Destination index</p>
            <h1>Scout the next peak before the road gets rough.</h1>
            <p>
              Search practical mountain field notes by place, region, terrain signal,
              or elevation. Verified guides sit alongside clearly marked catalog previews.
            </p>
          </div>
          <motion.div
            className="places-hero-stats"
            aria-label="Places features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span><LuCompass /> Ranked destination search</span>
            <span><LuMountain /> Verified mountain guides</span>
            <span><LuSparkles /> Honest catalog previews</span>
          </motion.div>
        </motion.section>

        <motion.section
          className="places-search-container"
          aria-label="Search destinations"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="places-search-bar">
            <LuSearch className="places-search-icon" />
            <input
              type="search"
              placeholder="Search mountains, trail towns, or regions..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="places-input"
            />
            <AnimatePresence>
              {hasSearch && (
                <motion.button
                  className="places-clear-search"
                  type="button"
                  onClick={clearSearch}
                  title="Clear search"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <LuX />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="places-filters">
            <span className="places-filter-label"><LuSlidersHorizontal /> Refine</span>
            <select value={filters.continent} onChange={(event) => setFilter("continent", event.target.value)}>
              <option value="">All continents</option>
              <option>Asia</option>
              <option>Europe</option>
              <option>North America</option>
              <option>South America</option>
              <option>Africa</option>
              <option>Oceania</option>
            </select>
            <select value={filters.destination_type} onChange={(event) => setFilter("destination_type", event.target.value)}>
              <option value="">All destination types</option>
              <option value="mountain_town">Mountain towns</option>
              <option value="mountain_resort">Mountain resorts</option>
              <option value="ski_area">Ski areas</option>
              <option value="mountain_pass">Mountain passes</option>
              <option value="mountain_hut">Mountain huts</option>
              <option value="trail_hub">Trail hubs</option>
              <option value="national_park">National parks</option>
            </select>
            <select value={filters.min_elevation_m} onChange={(event) => setFilter("min_elevation_m", event.target.value)}>
              <option value="">Any elevation</option>
              <option value="500">500+ meters</option>
              <option value="1000">1,000+ meters</option>
              <option value="2000">2,000+ meters</option>
            </select>
            <input
              type="search"
              placeholder="Filter tags"
              value={filters.tags}
              onChange={(event) => setFilter("tags", event.target.value)}
            />
          </div>
        </motion.section>

        {hasSearch ? (
          <section className="places-results">
            <div className="featured-header">
              <div>
                <p className="eyebrow">Search report</p>
                <h2>{searchLoading ? "Scouting destinations" : `${searchResults.length} destinations found`}</h2>
              </div>
            </div>
            {searchError && (
              <motion.div
                className="places-empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {searchError}
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {!searchLoading && !searchError && searchResults.length === 0 && (
                <motion.div
                  className="places-empty-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <LuCompass />
                  <h3>No trailhead yet</h3>
                  <p>Try a wider region, a lower elevation, or fewer tags.</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!searchLoading && renderCards(searchResults, "Field note")}
          </section>
        ) : (
          <section className="featured-places">
            <div className="featured-header">
              <div>
                <p className="eyebrow">Start with a signal</p>
                <h2>Featured mountain destinations</h2>
              </div>
            </div>
            {featuredLoading
              ? <motion.div className="loading-spinner" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  Loading destination notes...
                </motion.div>
              : renderCards(featuredPlaces, "Featured")}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Places;
