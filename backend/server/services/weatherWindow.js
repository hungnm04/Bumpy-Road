const pool = require("../config/db");
const { fetchJson } = require("../ingestion/httpClient");

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_RESULTS = 12;
const MAX_CANDIDATES = 32;
const FORECAST_BATCH_SIZE = 8;

const HOURLY_FIELDS = [
  "is_day",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "snowfall",
  "visibility",
  "wind_gusts_10m",
];

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function parseDate(value, label) {
  const parsed = new Date(`${value}T00:00:00Z`);

  if (!value || Number.isNaN(parsed.getTime()) || dateOnly(parsed) !== value) {
    const error = new Error(`${label} must use YYYY-MM-DD format`);
    error.status = 400;
    throw error;
  }

  return parsed;
}

function validateDateRange(startValue, endValue) {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = parseDate(startValue, "start_date");
  const end = parseDate(endValue, "end_date");

  if (start < todayUtc || end < start || end > addDays(todayUtc, 7)) {
    const error = new Error("Choose a date range from today through the next 7 days");
    error.status = 400;
    throw error;
  }

  return { startDate: dateOnly(start), endDate: dateOnly(end) };
}

function numericValues(values = []) {
  return values.filter((value) => Number.isFinite(Number(value))).map(Number);
}

function maxValue(values, fallback = 0) {
  const numbers = numericValues(values);
  return numbers.length > 0 ? Math.max(...numbers) : fallback;
}

function minValue(values, fallback = null) {
  const numbers = numericValues(values);
  return numbers.length > 0 ? Math.min(...numbers) : fallback;
}

function scoreHour(hourly, index) {
  const precipProbability = Number(hourly.precipitation_probability?.[index] || 0);
  const precipitation = Number(hourly.precipitation?.[index] || 0);
  const gust = Number(hourly.wind_gusts_10m?.[index] || 0);
  const visibility = Number(hourly.visibility?.[index] || 10000);

  return 100 - precipProbability * 0.55 - precipitation * 4 - gust * 0.65
    + Math.min(visibility / 1000, 10);
}

function findBestWindow(hourly) {
  const daylightIndices = (hourly.time || [])
    .map((_, index) => index)
    .filter((index) => hourly.is_day?.[index] === 1);
  const indices = daylightIndices.length > 0
    ? daylightIndices
    : (hourly.time || []).map((_, index) => index);
  let best = null;

  for (let index = 0; index < indices.length; index += 1) {
    const window = indices.slice(index, index + 4);

    if (window.length < 2) continue;
    if (window.some((hourIndex, offset) => offset > 0 && hourIndex !== window[offset - 1] + 1)) {
      continue;
    }

    const windowScore = window.reduce((sum, hourIndex) => sum + scoreHour(hourly, hourIndex), 0)
      / window.length;

    if (!best || windowScore > best.score) {
      best = {
        start: hourly.time[window[0]],
        end: hourly.time[window[window.length - 1]],
        score: Math.round(windowScore),
      };
    }
  }

  return best;
}

function summarizeForecast(payload) {
  const hourly = payload.hourly || {};
  const daylightIndices = (hourly.time || [])
    .map((_, index) => index)
    .filter((index) => hourly.is_day?.[index] === 1);
  const scopedIndices = daylightIndices.length > 0
    ? daylightIndices
    : (hourly.time || []).map((_, index) => index);
  const valuesFor = (field) => scopedIndices.map((index) => hourly[field]?.[index]);
  const apparentValues = numericValues(valuesFor("apparent_temperature"));
  const visibilityM = minValue(valuesFor("visibility"));

  return {
    timezone: payload.timezone || "local destination time",
    fetched_at: new Date().toISOString(),
    max_precipitation_probability: Math.round(maxValue(valuesFor("precipitation_probability"))),
    max_precipitation_mm: Number(maxValue(valuesFor("precipitation")).toFixed(1)),
    max_snowfall_cm: Number(maxValue(valuesFor("snowfall")).toFixed(1)),
    max_wind_gust_kmh: Math.round(maxValue(valuesFor("wind_gusts_10m"))),
    min_apparent_temperature_c: apparentValues.length > 0
      ? Number(Math.min(...apparentValues).toFixed(1))
      : null,
    max_apparent_temperature_c: apparentValues.length > 0
      ? Number(Math.max(...apparentValues).toFixed(1))
      : null,
    min_visibility_km: visibilityM === null ? null : Number((visibilityM / 1000).toFixed(1)),
    best_window: findBestWindow(hourly),
  };
}

function getTolerancePreferences(filters = {}) {
  const tolerance = filters.tolerance || "balanced";
  const presets = {
    sheltered: { rain: 35, wind: 38, visibility: 5 },
    balanced: { rain: 50, wind: 50, visibility: 3 },
    flexible: { rain: 65, wind: 62, visibility: 2 },
  };

  return presets[tolerance] || presets.balanced;
}

function scoreForecast(destination, summary, filters = {}) {
  const tolerances = getTolerancePreferences(filters);
  const experience = filters.experience || "intermediate";
  let score = 100;
  const reasons = [];
  const tradeoffs = [];

  if (summary.max_precipitation_probability <= 25) {
    reasons.push("Lower daytime rain risk in the current forecast");
  } else {
    score -= Math.max(0, summary.max_precipitation_probability - tolerances.rain) * 0.75;
    tradeoffs.push(`Daytime rain probability reaches ${summary.max_precipitation_probability}%`);
  }

  if (summary.max_wind_gust_kmh <= 35) {
    reasons.push("Wind gusts look moderate for comparison planning");
  } else {
    score -= Math.max(0, summary.max_wind_gust_kmh - tolerances.wind) * 1.15;
    tradeoffs.push(`Forecast gusts reach ${summary.max_wind_gust_kmh} km/h`);
  }

  if (summary.min_visibility_km !== null && summary.min_visibility_km >= 8) {
    reasons.push("Daytime visibility looks promising");
  } else if (summary.min_visibility_km !== null && summary.min_visibility_km < tolerances.visibility) {
    score -= (tolerances.visibility - summary.min_visibility_km) * 6;
    tradeoffs.push(`Visibility may fall near ${summary.min_visibility_km} km`);
  }

  if (summary.max_snowfall_cm > 0) {
    score -= Math.min(summary.max_snowfall_cm * 3, 18);
    tradeoffs.push(`Forecast includes up to ${summary.max_snowfall_cm} cm of snowfall`);
  }

  if (
    experience === "beginner"
    && ["mountain_hut", "mountain_pass"].includes(destination.destination_type)
  ) {
    score -= 12;
    tradeoffs.push("This destination style needs more access planning for a first mountain trip");
  }

  if (experience === "beginner" && Number(destination.elevation_m) >= 2500) {
    score -= 8;
    tradeoffs.push("Higher elevation adds uncertainty for a beginner-led plan");
  }

  if (summary.best_window) {
    reasons.push("A usable daylight window appears in the hourly comparison");
  } else {
    score -= 15;
    tradeoffs.push("No clear daylight window was found in the hourly forecast");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label = boundedScore >= 75
    ? "Strong weather window"
    : boundedScore >= 50
      ? "Possible with adjustments"
      : "Consider another day";

  return {
    score: boundedScore,
    label,
    reasons: reasons.slice(0, 3),
    tradeoffs: tradeoffs.slice(0, 3),
    confidence: summary.best_window && summary.min_visibility_km !== null ? "forecast-backed" : "limited",
  };
}

function buildForecastUrl(destinations, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: destinations.map((destination) => destination.latitude).join(","),
    longitude: destinations.map((destination) => destination.longitude).join(","),
    hourly: HOURLY_FIELDS.join(","),
    timezone: "auto",
    start_date: startDate,
    end_date: endDate,
  });

  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function normalizeForecastPayload(payload) {
  return Array.isArray(payload) ? payload : [payload];
}

async function fetchForecasts(destinations, startDate, endDate) {
  const forecasts = [];

  for (let index = 0; index < destinations.length; index += FORECAST_BATCH_SIZE) {
    const batch = destinations.slice(index, index + FORECAST_BATCH_SIZE);
    const response = await fetchJson(buildForecastUrl(batch, startDate, endDate), {
      cacheTtlMs: FORECAST_CACHE_TTL_MS,
    });
    const batchForecasts = normalizeForecastPayload(response);

    if (batchForecasts.length !== batch.length) {
      throw new Error("Forecast provider returned an unexpected batch size");
    }

    forecasts.push(...batchForecasts);
  }

  return forecasts;
}

async function findGuideCandidates(filters = {}) {
  const values = [];
  const conditions = [
    "publication_status = 'published'",
    "guide_status = 'guide_ready'",
    "photo_verified = true",
    "latitude IS NOT NULL",
    "longitude IS NOT NULL",
  ];
  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.countryCode) {
    conditions.push(`upper(country_code) = upper(${addValue(filters.countryCode)})`);
  }

  if (filters.region) {
    conditions.push(`(region ILIKE '%' || ${addValue(filters.region)} || '%' OR location ILIKE '%' || $${values.length} || '%')`);
  }

  if (filters.destinationType) {
    conditions.push(`destination_type = ${addValue(filters.destinationType)}`);
  }

  if (Number.isFinite(filters.maxElevationM)) {
    conditions.push(`elevation_m <= ${addValue(filters.maxElevationM)}`);
  }

  const { rows } = await pool.query(
    `SELECT
       id, slug, name, location, region, country_code, continent, latitude, longitude,
       elevation_m, destination_type, photo_url, traveler_fit, avoid_if, best_seasons,
       guide_quality_score
     FROM mountains
     WHERE ${conditions.join(" AND ")}
     ORDER BY guide_quality_score DESC, name ASC
     LIMIT ${MAX_CANDIDATES}`,
    values
  );

  return rows;
}

function providerAttribution() {
  return {
    label: "Forecast by Open-Meteo",
    url: "https://open-meteo.com/",
  };
}

async function rankWeatherWindows(filters = {}) {
  const { startDate, endDate } = validateDateRange(filters.startDate, filters.endDate);
  const candidates = await findGuideCandidates(filters);

  if (candidates.length === 0) {
    return {
      results: [],
      meta: {
        start_date: startDate,
        end_date: endDate,
        generated_at: new Date().toISOString(),
        provider_attribution: providerAttribution(),
      },
    };
  }

  const forecasts = await fetchForecasts(candidates, startDate, endDate);
  const results = candidates
    .map((destination, index) => {
      const conditions = summarizeForecast(forecasts[index]);
      return {
        ...destination,
        conditions,
        recommendation: scoreForecast(destination, conditions, filters),
      };
    })
    .sort((left, right) =>
      right.recommendation.score - left.recommendation.score
      || right.guide_quality_score - left.guide_quality_score
      || left.name.localeCompare(right.name)
    )
    .slice(0, Math.min(filters.limit || 8, MAX_RESULTS));

  return {
    results,
    meta: {
      start_date: startDate,
      end_date: endDate,
      generated_at: new Date().toISOString(),
      provider_attribution: providerAttribution(),
    },
  };
}

async function getPlaceConditions(id, filters = {}) {
  const { startDate, endDate } = validateDateRange(filters.startDate, filters.endDate);
  const { rows } = await pool.query(
    `SELECT id, destination_type, elevation_m, latitude, longitude
     FROM mountains
     WHERE id = $1
       AND publication_status = 'published'
       AND guide_status = 'guide_ready'
       AND latitude IS NOT NULL
       AND longitude IS NOT NULL`,
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  const [forecast] = await fetchForecasts(rows, startDate, endDate);
  const conditions = summarizeForecast(forecast);

  return {
    conditions,
    recommendation: scoreForecast(rows[0], conditions, filters),
    meta: {
      start_date: startDate,
      end_date: endDate,
      generated_at: new Date().toISOString(),
      provider_attribution: providerAttribution(),
    },
  };
}

module.exports = {
  findBestWindow,
  getPlaceConditions,
  rankWeatherWindows,
  scoreForecast,
  summarizeForecast,
  validateDateRange,
};
