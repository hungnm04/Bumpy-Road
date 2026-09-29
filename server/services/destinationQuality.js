const GUIDE_READY_MIN_SCORE = 85;
const GUIDE_READY_DESCRIPTION_WORDS = 150;

const TYPE_PROFILES = {
  mountain_resort: {
    label: "mountain resort",
    fit: ["alpine base travelers", "mixed-activity groups", "weather-flexible weekends"],
    avoid: ["travelers expecting a single fixed trail plan", "visitors skipping local access checks"],
    seasons: ["summer", "winter", "shoulder season with local checks"],
    stay: "Use it as a returning base: sleep in one place and choose day plans after checking local conditions.",
    transport: "Confirm the last connection and the local transfer before departure. Resort access can vary by season and operating calendar.",
    planning: "Keep one lower-elevation alternative ready. A base destination is most useful when the group can adjust the day without abandoning the trip.",
  },
  ski_area: {
    label: "ski area",
    fit: ["snow-focused travelers", "winter-sports planners", "short forecast-led trips"],
    avoid: ["travelers assuming lifts operate in every season", "groups without a non-snow fallback"],
    seasons: ["winter", "snow season with operator confirmation"],
    stay: "Treat it as a snow-sports destination and confirm the operating calendar before booking a fixed itinerary.",
    transport: "Check the official operator for lift status, road access, parking, and public-transport connections close to the travel date.",
    planning: "Snow depth, wind, visibility, and lift operations matter together. A promising forecast is a planning signal, not an operating guarantee.",
  },
  mountain_pass: {
    label: "mountain pass",
    fit: ["scenic-road travelers", "viewpoint hunters", "nearby-hike planners"],
    avoid: ["travelers treating the pass as a full-service base", "drivers skipping road-status checks"],
    seasons: ["late spring", "summer", "early autumn", "winter only with local confirmation"],
    stay: "Plan it as a high-country crossing or focused day stop rather than assuming accommodation and services at the pass itself.",
    transport: "Check the relevant road authority before departure. Pass access can change quickly with snow, wind, maintenance, and seasonal closures.",
    planning: "Visibility and wind often decide whether the stop is worthwhile. Keep a valley alternative ready when the high point looks exposed.",
  },
  mountain_hut: {
    label: "mountain hut",
    fit: ["prepared hikers", "climbers", "overnight-route planners"],
    avoid: ["travelers seeking hotel-style services", "groups without a confirmed route and hut booking"],
    seasons: ["summer", "early autumn", "other seasons with hut confirmation"],
    stay: "Treat the hut as a simple high-country refuge. Confirm booking rules, meals, water, bedding, payment, and opening dates directly with the operator.",
    transport: "Plan the trailhead connection and approach route separately. The mapped hut location is not a promise of straightforward access.",
    planning: "Weather Window can help compare dates, but it does not replace route planning, local notices, or an honest assessment of the group's experience.",
  },
  mountain_town: {
    label: "mountain town",
    fit: ["first-time mountain travelers", "car-free planners", "flexible weekend groups"],
    avoid: ["travelers expecting every activity to start from the town center"],
    seasons: ["year-round with seasonal planning"],
    stay: "Use the town as a comfortable base and choose nearby outings after checking conditions and local transport.",
    transport: "Check the final rail, bus, or road connection and confirm how the group will reach the day's trailhead or viewpoint.",
    planning: "A town base works best when the itinerary leaves room for weather changes and different energy levels.",
  },
};

function words(value = "") {
  return value.trim().split(/\s+/).filter(Boolean);
}

function getTypeProfile(destinationType) {
  return TYPE_PROFILES[destinationType] || TYPE_PROFILES.mountain_town;
}

function buildOriginalOverview(destination) {
  const profile = getTypeProfile(destination.destination_type);
  const region = destination.region?.trim();
  const location = destination.location?.trim() || "its region";
  const area = region && region !== location ? `${region}, ${location}` : location;
  const elevation = Number.isFinite(Number(destination.elevation_m))
    ? `${Number(destination.elevation_m).toLocaleString("en-US")} meters`
    : "an elevation that should be checked against the chosen route";

  return `${destination.name} is a ${profile.label} in ${area}. Bumpy Road treats it as a practical trip-planning option rather than a checklist attraction. Its mapped position sits at ${elevation}, which makes the local forecast, visibility, wind, and last-mile access worth checking before the group commits to a fixed day plan.

This destination is best approached with a flexible outline. ${profile.stay} ${profile.transport} The right choice depends on what the group actually wants from the trip: a comfortable base, a snow-focused day, a scenic crossing, or a more remote overnight route.

Use the live conditions panel as a decision aid, then confirm local notices and operating information close to departure. ${profile.planning} Bumpy Road keeps this guide deliberately plain-spoken: it explains the shape of the trip, highlights the trade-offs, and leaves safety-sensitive decisions with current local guidance.`;
}

function evaluateGuideQuality(destination) {
  const issues = [];
  let score = 0;

  if (destination.name?.trim()) score += 5;
  else issues.push("missing name");

  if (destination.location?.trim() && destination.location !== "Unknown") score += 10;
  else issues.push("unknown location");

  if (destination.country_code?.trim()) score += 5;
  else issues.push("missing country code");

  if (destination.continent?.trim() && destination.continent !== "Unknown") score += 5;
  else issues.push("unknown continent");

  if (destination.latitude !== null && destination.longitude !== null) score += 20;
  else issues.push("missing coordinates");

  if (destination.destination_type?.trim()) score += 10;
  else issues.push("missing destination type");

  if (destination.has_primary_media || destination.photo_verified) score += 20;
  else issues.push("missing verified destination photo");

  if (words(destination.description).length >= GUIDE_READY_DESCRIPTION_WORDS) score += 15;
  else issues.push(`overview must contain at least ${GUIDE_READY_DESCRIPTION_WORDS} words`);

  if ((destination.traveler_fit || []).length > 0) score += 5;
  else issues.push("missing traveler fit guidance");

  if (destination.transport_notes?.trim() && destination.planning_notes?.trim()) score += 5;
  else issues.push("missing practical planning notes");

  return { score, issues, ready: score >= GUIDE_READY_MIN_SCORE && issues.length === 0 };
}

function buildGuideProfile(destination) {
  const profile = getTypeProfile(destination.destination_type);
  const enriched = {
    ...destination,
    description: buildOriginalOverview(destination),
    traveler_fit: profile.fit,
    avoid_if: profile.avoid,
    best_seasons: profile.seasons,
    stay_style: profile.stay,
    transport_notes: profile.transport,
    planning_notes: profile.planning,
  };

  return { ...enriched, ...evaluateGuideQuality(enriched) };
}

module.exports = {
  GUIDE_READY_MIN_SCORE,
  buildGuideProfile,
  buildOriginalOverview,
  evaluateGuideQuality,
};
