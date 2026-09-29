const test = require("node:test");
const assert = require("node:assert/strict");
const { requireEnvSecret, requireRole } = require("../../server/middlewares/auth");

test("requireEnvSecret rejects missing and short secrets", () => {
  const original = process.env.TEST_SECRET;

  try {
    delete process.env.TEST_SECRET;
    assert.throws(() => requireEnvSecret("TEST_SECRET"), /at least 32 characters/);

    process.env.TEST_SECRET = "too-short";
    assert.throws(() => requireEnvSecret("TEST_SECRET"), /at least 32 characters/);
  } finally {
    if (original === undefined) {
      delete process.env.TEST_SECRET;
    } else {
      process.env.TEST_SECRET = original;
    }
  }
});

test("requireEnvSecret returns an adequately long secret", () => {
  const original = process.env.TEST_SECRET;
  const secret = "a-secure-test-secret-with-more-than-32-characters";

  try {
    process.env.TEST_SECRET = secret;
    assert.equal(requireEnvSecret("TEST_SECRET"), secret);
  } finally {
    if (original === undefined) {
      delete process.env.TEST_SECRET;
    } else {
      process.env.TEST_SECRET = original;
    }
  }
});

test("requireRole allows admins and blocks guests", () => {
  const middleware = requireRole("admin");
  let called = false;

  middleware({ user: { role: "admin" } }, {}, () => {
    called = true;
  });

  assert.equal(called, true);

  const response = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  middleware({ user: { role: "guest" } }, response, () => {
    throw new Error("Guest role should not continue");
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.payload, { message: "Forbidden" });
});
