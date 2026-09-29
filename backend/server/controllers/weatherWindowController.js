const {
  getPlaceConditions,
  rankWeatherWindows,
} = require("../services/weatherWindow");

function boundedInteger(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
}

function defaultDates() {
  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 2);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function requestFilters(query) {
  const defaults = defaultDates();

  return {
    startDate: query.start_date || defaults.startDate,
    endDate: query.end_date || defaults.endDate,
    countryCode: query.country_code?.trim(),
    region: query.region?.trim(),
    destinationType: query.destination_type?.trim(),
    experience: query.experience?.trim(),
    tolerance: query.tolerance?.trim(),
    maxElevationM: query.max_elevation_m
      ? boundedInteger(query.max_elevation_m, null, { min: 0, max: 9000 })
      : null,
    limit: boundedInteger(query.limit, 8, { min: 1, max: 12 }),
  };
}

async function getWeatherWindow(req, res, next) {
  try {
    return res.json(await rankWeatherWindows(requestFilters(req.query)));
  } catch (error) {
    return next(error);
  }
}

async function getConditions(req, res, next) {
  const placeId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(placeId)) {
    return res.status(400).json({ message: "Invalid place ID" });
  }

  try {
    const result = await getPlaceConditions(placeId, requestFilters(req.query));

    return result
      ? res.json(result)
      : res.status(404).json({ message: "Live conditions are not available for this place" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getConditions,
  getWeatherWindow,
};
