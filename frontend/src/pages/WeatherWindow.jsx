import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuArrowRight,
  LuCalendarDays,
  LuCloudSun,
  LuMapPin,
  LuMountain,
  LuSearch,
  LuShieldCheck,
  LuWind,
} from "react-icons/lu";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getMountainImageUrl } from "../api/assetUrls";
import "./WeatherWindowStyles.css";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatWindow(window) {
  if (!window) return "No clear daylight block";
  const start = new Date(window.start);
  const end = new Date(window.end);

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function WeatherResult({ place, onOpen, index }) {
  const imageUrl = getMountainImageUrl(place.photo_url);

  return (
    <motion.article
      className="weather-result"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <motion.div
        className="weather-result-image"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
      >
        {imageUrl ? <img src={imageUrl} alt={place.name} /> : <div>Photo pending</div>}
      </motion.div>
      <div className="weather-result-body">
        <div className="weather-result-heading">
          <div>
            <p className="weather-result-rank">{place.recommendation.label}</p>
            <h2>{place.name}</h2>
            <p><LuMapPin /> {place.region || place.location}</p>
          </div>
          <motion.div
            className="weather-score"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 + index * 0.1 }}
          >
            {place.recommendation.score}
          </motion.div>
        </div>
        <motion.div
          className="weather-condition-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.1 }}
        >
          <span><LuCloudSun /> {place.conditions.max_precipitation_probability}% rain risk</span>
          <span><LuWind /> {place.conditions.max_wind_gust_kmh} km/h gusts</span>
          <span><LuCalendarDays /> {formatWindow(place.conditions.best_window)}</span>
        </motion.div>
        <motion.div
          className="weather-result-notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + index * 0.1 }}
        >
          <div>
            <h3>Why it surfaced</h3>
            {(place.recommendation.reasons.length > 0
              ? place.recommendation.reasons
              : ["This is one of the stronger guide-ready matches for the selected filters."])
              .map((reason) => <p key={reason}>{reason}</p>)}
          </div>
          {place.recommendation.tradeoffs.length > 0 && (
            <div>
              <h3>Trade-offs</h3>
              {place.recommendation.tradeoffs.map((tradeoff) => <p key={tradeoff}>{tradeoff}</p>)}
            </div>
          )}
        </motion.div>
        <motion.button
          type="button"
          className="weather-open-guide"
          onClick={onOpen}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          Open destination guide <LuArrowRight />
        </motion.button>
      </div>
    </motion.article>
  );
}

function WeatherWindow() {
  const navigate = useNavigate();
  const today = new Date();
  const [filters, setFilters] = useState({
    start_date: formatDate(today),
    end_date: formatDate(addDays(today, 2)),
    region: "",
    country_code: "",
    destination_type: "",
    experience: "intermediate",
    tolerance: "balanced",
    max_elevation_m: "",
  });
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const maxDate = formatDate(addDays(today, 7));

  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(true);

    try {
      const params = new URLSearchParams({ limit: "8" });
      Object.entries(filters).forEach(([key, value]) => {
        if (String(value).trim()) params.set(key, String(value).trim());
      });
      const response = await fetch(`/api/weather-window?${params}`);
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || "Forecast comparison is unavailable.");
      setResults(payload.results);
      setMeta(payload.meta);
    } catch (requestError) {
      setResults([]);
      setMeta(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weather-window-page">
      <Navbar />
      <main className="weather-window-content">
        <motion.section
          className="weather-window-intro"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="eyebrow">Forecast-led shortlist</p>
            <h1>Find a better mountain weather window.</h1>
            <p>
              Compare reviewed destination guides against the next seven days.
              The ranking is deterministic, forecast-backed, and built to show its trade-offs.
            </p>
          </div>
          <motion.div
            className="weather-window-signals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span><LuShieldCheck /> Guide-ready destinations only</span>
            <span><LuCloudSun /> Live hourly forecast comparison</span>
            <span><LuMountain /> Practical alternatives, not promises</span>
          </motion.div>
        </motion.section>

        <motion.form
          className="weather-window-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label>
            <span>Start date</span>
            <input type="date" min={formatDate(today)} max={maxDate} value={filters.start_date} onChange={(event) => setFilter("start_date", event.target.value)} required />
          </label>
          <label>
            <span>End date</span>
            <input type="date" min={filters.start_date} max={maxDate} value={filters.end_date} onChange={(event) => setFilter("end_date", event.target.value)} required />
          </label>
          <label>
            <span>Region</span>
            <input value={filters.region} onChange={(event) => setFilter("region", event.target.value)} placeholder="Alps, Hokkaido..." />
          </label>
          <label>
            <span>Country code</span>
            <input value={filters.country_code} onChange={(event) => setFilter("country_code", event.target.value)} placeholder="CH" maxLength="2" />
          </label>
          <label>
            <span>Destination style</span>
            <select value={filters.destination_type} onChange={(event) => setFilter("destination_type", event.target.value)}>
              <option value="">Any reviewed style</option>
              <option value="mountain_resort">Mountain resort</option>
              <option value="ski_area">Ski area</option>
              <option value="mountain_pass">Mountain pass</option>
              <option value="mountain_hut">Mountain hut</option>
            </select>
          </label>
          <label>
            <span>Experience</span>
            <select value={filters.experience} onChange={(event) => setFilter("experience", event.target.value)}>
              <option value="beginner">Beginner-led group</option>
              <option value="intermediate">Some mountain experience</option>
              <option value="experienced">Experienced planners</option>
            </select>
          </label>
          <label>
            <span>Weather tolerance</span>
            <select value={filters.tolerance} onChange={(event) => setFilter("tolerance", event.target.value)}>
              <option value="sheltered">Prefer sheltered plans</option>
              <option value="balanced">Balanced comparison</option>
              <option value="flexible">Flexible about conditions</option>
            </select>
          </label>
          <label>
            <span>Maximum elevation</span>
            <select value={filters.max_elevation_m} onChange={(event) => setFilter("max_elevation_m", event.target.value)}>
              <option value="">Any elevation</option>
              <option value="1500">Up to 1,500 m</option>
              <option value="2500">Up to 2,500 m</option>
              <option value="3500">Up to 3,500 m</option>
            </select>
          </label>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LuSearch /> {loading ? "Comparing forecasts..." : "Find weather windows"}
          </motion.button>
        </motion.form>

        <section className="weather-window-results" aria-live="polite">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="weather-window-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          {!error && meta && (
            <motion.div
              className="weather-window-report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <p className="eyebrow">Comparison report</p>
                <h2>{results.length} guide-ready matches</h2>
              </div>
              <p>
                Updated {new Date(meta.generated_at).toLocaleString()}.
                {" "}<a href={meta.provider_attribution.url} target="_blank" rel="noreferrer">{meta.provider_attribution.label}</a>.
              </p>
            </motion.div>
          )}
          {!loading && meta && results.length === 0 && (
            <motion.div
              className="weather-window-message"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              No reviewed guides match that combination yet. Try a wider region or a higher elevation limit.
            </motion.div>
          )}
          <div className="weather-result-list">
            {results.map((place, index) => (
              <WeatherResult key={place.id} place={place} onOpen={() => navigate(`/places/${place.id}`)} index={index} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default WeatherWindow;
