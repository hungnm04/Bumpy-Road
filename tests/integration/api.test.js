const test = require("node:test");
const assert = require("node:assert/strict");

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:5000";
const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const testUser = {
  username: `tdd_guest_${suffix}`,
  email: `tdd_guest_${suffix}@example.com`,
  password: "TrailTestPass123!",
};

function updateCookieJar(response, cookieJar) {
  const setCookies = response.headers.getSetCookie?.() || [];

  for (const cookie of setCookies) {
    const [pair] = cookie.split(";", 1);
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);

    if (!value || /max-age=0/i.test(cookie)) {
      cookieJar.delete(name);
    } else {
      cookieJar.set(name, value);
    }
  }
}

async function request(path, { method = "GET", body, cookieJar, headers = {} } = {}) {
  const requestHeaders = { ...headers };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (cookieJar?.size) {
    requestHeaders.Cookie = [...cookieJar.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (cookieJar) {
    updateCookieJar(response, cookieJar);
  }

  return response;
}

async function json(response) {
  return response.json();
}

test("Bumpy Road API regression suite", async (t) => {
  const guestCookies = new Map();
  const adminCookies = new Map();
  let firstPlace;

  await t.test("health check confirms database connectivity", async () => {
    const response = await request("/healthz");

    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), { status: "ok" });
  });

  await t.test("public SPA routes return the built React shell", async () => {
    for (const path of ["/", "/places", "/weather-window", "/blog", "/login", "/create-account"]) {
      const response = await request(path, {
        headers: { Accept: "text/html" },
      });
      const html = await response.text();

      assert.equal(response.status, 200, `${path} should load`);
      assert.match(response.headers.get("content-type") || "", /text\/html/);
      assert.match(html, /<div id="root"><\/div>/);
    }
  });

  await t.test("weather window rejects stale dates before provider traffic", async () => {
    const response = await request("/api/weather-window?start_date=1999-01-01&end_date=1999-01-02");
    const payload = await json(response);

    assert.equal(response.status, 400);
    assert.match(payload.message, /next 7 days/i);
  });

  await t.test("catalog search supports limits, exact names, aliases, filters, and offsets", async () => {
    const response = await request("/places?limit=500");
    const places = await json(response);

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(places));
    assert.ok(places.length > 0);
    assert.ok(places.length <= 50);
    firstPlace = places[0];

    const encodedName = encodeURIComponent(firstPlace.name);
    const exactPlaces = await json(await request(`/places?q=${encodedName}&limit=5`));
    const aliasPlaces = await json(await request(`/places?name=${encodedName}&limit=5`));

    assert.equal(exactPlaces[0].name, firstPlace.name);
    assert.equal(aliasPlaces[0].name, firstPlace.name);

    if (firstPlace.destination_type) {
      const type = encodeURIComponent(firstPlace.destination_type);
      const typedPlaces = await json(await request(`/places?destination_type=${type}&limit=5`));

      assert.ok(typedPlaces.length > 0);
      assert.ok(typedPlaces.every((place) => place.destination_type === firstPlace.destination_type));
    }

    if (places.length > 1) {
      const offsetPlaces = await json(await request("/places?limit=1&offset=1"));
      assert.equal(offsetPlaces.length, 1);
      assert.notEqual(offsetPlaces[0].id, firstPlace.id);
    }
  });

  await t.test("place details and reviews are publicly readable", async () => {
    const placeResponse = await request(`/places/${firstPlace.id}`);
    const reviewsResponse = await request(`/mountains/${firstPlace.id}/reviews`);

    assert.equal(placeResponse.status, 200);
    assert.equal((await json(placeResponse)).id, firstPlace.id);
    assert.equal(reviewsResponse.status, 200);
    assert.ok(Array.isArray(await json(reviewsResponse)));
  });

  await t.test("editorial blog catalog stays diverse", async () => {
    const response = await request("/api/blog");
    const payload = await json(response);
    const titles = new Set(payload.blogs.map((blog) => blog.title));
    const categories = new Set(payload.blogs.map((blog) => blog.category));

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.blogs.length >= 12);
    assert.equal(titles.size, payload.blogs.length);
    assert.ok(categories.size >= 6);
  });

  await t.test("registration, login, session, profile, and guest role isolation work", async () => {
    const registerResponse = await request("/create-account", {
      method: "POST",
      body: testUser,
    });

    assert.equal(registerResponse.status, 201);

    const loginResponse = await request("/login", {
      method: "POST",
      body: { username: testUser.username, password: testUser.password },
      cookieJar: guestCookies,
    });
    const loginPayload = await json(loginResponse);

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.user.role, "guest");
    assert.ok(guestCookies.has("accessToken"));
    assert.ok(guestCookies.has("refreshToken"));

    const authPayload = await json(await request("/auth-status", { cookieJar: guestCookies }));
    assert.equal(authPayload.authenticated, true);
    assert.equal(authPayload.user.username, testUser.username);

    const profileResponse = await request("/profile", { cookieJar: guestCookies });
    assert.equal(profileResponse.status, 200);
    assert.equal((await json(profileResponse)).profile.username, testUser.username);

    const adminResponse = await request("/admin/total-locations", { cookieJar: guestCookies });
    assert.equal(adminResponse.status, 403);

    const logoutResponse = await request("/logout", {
      method: "POST",
      cookieJar: guestCookies,
    });
    assert.equal(logoutResponse.status, 200);

    const loggedOutPayload = await json(await request("/auth-status", { cookieJar: guestCookies }));
    assert.equal(loggedOutPayload.authenticated, false);
  });

  await t.test("development admin account reaches admin APIs and cleans up the test user", async () => {
    const loginResponse = await request("/login", {
      method: "POST",
      body: {
        username: process.env.TEST_ADMIN_USERNAME || "admin",
        password: process.env.TEST_ADMIN_PASSWORD || "AdminPass123!",
      },
      cookieJar: adminCookies,
    });

    assert.equal(loginResponse.status, 200);
    assert.equal((await json(loginResponse)).user.role, "admin");

    const locationsResponse = await request("/admin/total-locations", {
      cookieJar: adminCookies,
    });
    assert.equal(locationsResponse.status, 200);

    const deleteResponse = await request(`/admin/users/${testUser.username}`, {
      method: "DELETE",
      cookieJar: adminCookies,
    });
    assert.equal(deleteResponse.status, 200);

    const mountainResponse = await request("/admin/mountains", {
      method: "POST",
      cookieJar: adminCookies,
      body: {
        name: `TDD Ridge ${suffix}`,
        location: "Testland",
        description: "A temporary destination created by the integration suite and removed after its admin workflow is verified.",
        continent: "Europe",
        photo_url: "/storage/mountain-photos/mountain_town_1.jpg",
        region: "Test Range",
        country_code: "TT",
        elevation_m: 2450,
        destination_type: "mountain_pass",
        editorial_tags: ["integration-test"],
      },
    });
    const mountainPayload = await json(mountainResponse);
    const mountainId = mountainPayload.mountain?.id;

    try {
      assert.equal(mountainResponse.status, 201);
      assert.equal(mountainPayload.mountain.region, "Test Range");
      assert.equal(mountainPayload.mountain.destination_type, "mountain_pass");
      assert.equal(mountainPayload.mountain.guide_status, "preview");

      const publicPreview = await json(await request(`/places?q=${encodeURIComponent(mountainPayload.mountain.name)}&limit=5`));
      assert.equal(publicPreview[0].guide_status, "preview");
      assert.equal(publicPreview[0].photo_url, null);

      const rejectedPromotion = await request(`/admin/mountains/${mountainId}`, {
        method: "PUT",
        cookieJar: adminCookies,
        body: {
          guide_status: "guide_ready",
          photo_verified: true,
        },
      });

      assert.equal(rejectedPromotion.status, 400);

      const updateResponse = await request(`/admin/mountains/${mountainId}`, {
        method: "PUT",
        cookieJar: adminCookies,
        body: {
          name: mountainPayload.mountain.name,
          location: mountainPayload.mountain.location,
          description: mountainPayload.mountain.description,
          continent: mountainPayload.mountain.continent,
          photo_url: mountainPayload.mountain.photo_url,
          region: "Updated Test Range",
          country_code: "TT",
          elevation_m: 2500,
          destination_type: "mountain_pass",
          editorial_tags: ["integration-test", "updated"],
        },
      });
      const updatePayload = await json(updateResponse);

      assert.equal(updateResponse.status, 200);
      assert.equal(updatePayload.mountain.region, "Updated Test Range");
      assert.equal(updatePayload.mountain.elevation_m, 2500);
      assert.deepEqual(updatePayload.mountain.editorial_tags, ["integration-test", "updated"]);
    } finally {
      if (mountainId) {
        const deleteMountainResponse = await request(`/admin/mountains/${mountainId}`, {
          method: "DELETE",
          cookieJar: adminCookies,
        });
        assert.equal(deleteMountainResponse.status, 200);
      }
    }
  });
});
