const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildGuideProfile,
  evaluateGuideQuality,
} = require("../../server/services/destinationQuality");

function eligibleDestination(overrides = {}) {
  return {
    id: 42,
    name: "Example Pass",
    location: "Exampleland",
    region: "Test Range",
    country_code: "TT",
    continent: "Europe",
    latitude: 46.2,
    longitude: 7.1,
    elevation_m: 2240,
    destination_type: "mountain_pass",
    has_primary_media: true,
    ...overrides,
  };
}

test("guide profiles turn structured facts into a complete practical overview", () => {
  const profile = buildGuideProfile(eligibleDestination());

  assert.equal(profile.ready, true);
  assert.ok(profile.description.split(/\s+/).length >= 150);
  assert.ok(profile.traveler_fit.length > 0);
  assert.match(profile.transport_notes, /road authority/i);
});

test("a guide cannot become ready without verified destination media", () => {
  const profile = buildGuideProfile(eligibleDestination({ has_primary_media: false }));
  const quality = evaluateGuideQuality(profile);

  assert.equal(quality.ready, false);
  assert.match(quality.issues.join(", "), /verified destination photo/i);
});
