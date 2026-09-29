const test = require("node:test");
const assert = require("node:assert/strict");
const { assertAllowedUrl } = require("../../server/ingestion/httpClient");
const { plainText } = require("../../server/ingestion/wikimedia");

test("ingestion URLs require HTTPS and an allowed host", () => {
  const original = process.env.INGEST_ALLOWED_HOSTS;

  try {
    process.env.INGEST_ALLOWED_HOSTS = "query.wikidata.org,commons.wikimedia.org";

    assert.equal(
      assertAllowedUrl("https://query.wikidata.org/sparql").hostname,
      "query.wikidata.org"
    );
    assert.throws(
      () => assertAllowedUrl("http://query.wikidata.org/sparql"),
      /must use HTTPS/
    );
    assert.throws(
      () => assertAllowedUrl("https://example.com/provider"),
      /host is not allowed/
    );
  } finally {
    if (original === undefined) {
      delete process.env.INGEST_ALLOWED_HOSTS;
    } else {
      process.env.INGEST_ALLOWED_HOSTS = original;
    }
  }
});

test("Wikimedia metadata is reduced to plain text", () => {
  assert.equal(
    plainText("<span>Mountain&nbsp;Photo</span> &amp; <b>credit</b>"),
    "Mountain Photo & credit"
  );
});
