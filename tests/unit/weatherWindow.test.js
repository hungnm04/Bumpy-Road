const test = require("node:test");
const assert = require("node:assert/strict");
const {
  scoreForecast,
  summarizeForecast,
  validateDateRange,
} = require("../../server/services/weatherWindow");

function forecastPayload() {
  return {
    timezone: "Europe/Zurich",
    hourly: {
      time: [
        "2026-06-03T08:00",
        "2026-06-03T09:00",
        "2026-06-03T10:00",
        "2026-06-03T11:00",
      ],
      is_day: [1, 1, 1, 1],
      apparent_temperature: [11, 12, 13, 14],
      precipitation_probability: [8, 10, 12, 14],
      precipitation: [0, 0, 0, 0],
      snowfall: [0, 0, 0, 0],
      visibility: [12000, 13000, 14000, 15000],
      wind_gusts_10m: [20, 22, 23, 24],
    },
  };
}

test("weather summaries identify a forecast-backed daylight window", () => {
  const summary = summarizeForecast(forecastPayload());

  assert.equal(summary.timezone, "Europe/Zurich");
  assert.equal(summary.max_precipitation_probability, 14);
  assert.equal(summary.max_wind_gust_kmh, 24);
  assert.ok(summary.best_window);
});

test("weather scoring stays deterministic and explains a strong match", () => {
  const summary = summarizeForecast(forecastPayload());
  const recommendation = scoreForecast(
    { destination_type: "mountain_resort", elevation_m: 1200 },
    summary,
    { experience: "beginner", tolerance: "balanced" }
  );

  assert.equal(recommendation.label, "Strong weather window");
  assert.ok(recommendation.score >= 75);
  assert.ok(recommendation.reasons.length > 0);
});

test("weather requests reject dates outside the next seven days", () => {
  assert.throws(
    () => validateDateRange("1999-01-01", "1999-01-02"),
    /next 7 days/
  );
});
