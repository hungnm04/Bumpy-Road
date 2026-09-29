const { fetchJson } = require("./httpClient");

const WIKIDATA_LICENSE = "CC0-1.0";
const WIKIDATA_ATTRIBUTION = "Destination facts from Wikidata";
const DESTINATION_TYPES = {
  Q130003: "mountain_resort",
  Q6925559: "mountain_resort",
  Q3034650: "ski_area",
  Q133056: "mountain_pass",
  Q182676: "mountain_hut",
};
const DISCOVERY_TYPE_IDS = Object.keys(DESTINATION_TYPES);
const DEFAULT_BATCH_SIZE = 100;

function bindingValue(binding, key) {
  return binding?.[key]?.value || null;
}

function externalIdFromUrl(url) {
  return url?.split("/").pop() || null;
}

function parsePoint(value) {
  const match = /^Point\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)$/.exec(value || "");

  if (!match) return {};

  return {
    longitude: Number(match[1]),
    latitude: Number(match[2]),
  };
}

function normalizeContinent(value) {
  if (!value) return "Unknown";
  return value.split(",")[0].trim();
}

function factualDescription({ name, location, region, elevationM, destinationType }) {
  const area = region && region !== location ? `${region}, ${location}` : location;
  const elevationText = Number.isFinite(elevationM)
    ? ` It sits at roughly ${Math.round(elevationM).toLocaleString("en-US")} meters, so weather and trail conditions can shift quickly.`
    : "";
  const descriptions = {
    mountain_resort: `${name} is a mountain resort in ${area}. It works well as a base for travelers who want alpine scenery, outdoor days, and the convenience of returning to the same place after exploring the surrounding terrain.`,
    ski_area: `${name} is a ski area in ${area}. It is most useful for travelers planning snow-focused days and looking for direct access to mountain terrain from a dedicated winter-sports base.`,
    mountain_pass: `${name} is a mountain pass in ${area}. It is a scenic high-country crossing rather than a full resort, making it a useful stop for travelers planning road trips, viewpoints, and nearby hikes.`,
    mountain_hut: `${name} is a mountain hut in ${area}. It is a simple high-country refuge for hikers and climbers, best suited to travelers preparing for a more remote mountain day or an overnight route.`,
  };

  return `${descriptions[destinationType] || `${name} is a mountain destination in ${area}. It is a useful starting point for exploring the surrounding high-country landscape.`}${elevationText}`;
}

function discoveryQuery(typeId, limit, offset) {
  return `
    SELECT ?place ?type ?placeLabel ?placeDescription ?countryLabel ?countryCode
      ?regionLabel ?continentLabel ?coord ?elevation ?image
    WHERE {
      BIND(wd:${typeId} AS ?type)
      ?place wdt:P17 ?country;
             wdt:P31 wd:${typeId};
             wdt:P625 ?coord.
      OPTIONAL { ?place wdt:P18 ?image. }
      OPTIONAL { ?place wdt:P2044 ?elevation. }
      OPTIONAL { ?country wdt:P297 ?countryCode. }
      OPTIONAL { ?country wdt:P30 ?continent. }
      OPTIONAL { ?place wdt:P131 ?region. }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
      }
    }
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

function normalizeDiscoveryBinding(binding) {
  const externalId = externalIdFromUrl(bindingValue(binding, "place"));
  const name = bindingValue(binding, "placeLabel");
  const location = bindingValue(binding, "countryLabel") || "Unknown";
  const region = bindingValue(binding, "regionLabel");
  const elevationValue = bindingValue(binding, "elevation");
  const elevationM = elevationValue === null ? null : Number(elevationValue);
  const destinationType = DESTINATION_TYPES[externalIdFromUrl(bindingValue(binding, "type"))]
    || "mountain_resort";

  if (!externalId || !name || name === externalId) return null;

  return {
    provider: "wikidata",
    externalId,
    sourceUrl: `https://www.wikidata.org/wiki/${externalId}`,
    licenseCode: WIKIDATA_LICENSE,
    attributionText: WIKIDATA_ATTRIBUTION,
    name,
    location,
    region,
    countryCode: bindingValue(binding, "countryCode"),
    continent: normalizeContinent(bindingValue(binding, "continentLabel")),
    ...parsePoint(bindingValue(binding, "coord")),
    elevationM: Number.isFinite(elevationM) ? Math.round(elevationM) : null,
    destinationType,
    sourceTags: [destinationType.replace(/_/g, "-"), "wikidata"],
    sourceDescription: bindingValue(binding, "placeDescription"),
    description: factualDescription({ name, location, region, elevationM, destinationType }),
    imageValue: bindingValue(binding, "image"),
    rawPayload: binding,
  };
}

async function discoverDestinations(limit, batchSize = DEFAULT_BATCH_SIZE) {
  const destinations = new Map();
  const typeOffsets = new Map();
  const typeExhausted = new Set();
  const perTypeTarget = Math.ceil(limit / DISCOVERY_TYPE_IDS.length);

  for (const typeId of DISCOVERY_TYPE_IDS) {
    let offset = 0;
    let fetchedForType = 0;

    while (destinations.size < limit && fetchedForType < perTypeTarget) {
      const pageLimit = Math.min(batchSize, perTypeTarget - fetchedForType);
      const params = new URLSearchParams({
        format: "json",
        query: discoveryQuery(typeId, pageLimit, offset),
      });
      let payload;

      try {
        payload = await fetchJson(`https://query.wikidata.org/sparql?${params}`, {
          cacheTtlMs: 6 * 60 * 60 * 1000,
        });
      } catch (error) {
        console.warn(`Skipping Wikidata category ${typeId} after provider failure: ${error.message}`);
        typeExhausted.add(typeId);
        break;
      }
      const bindings = payload.results?.bindings || [];
      fetchedForType += bindings.length;

      for (const binding of bindings) {
        const destination = normalizeDiscoveryBinding(binding);

        if (destination && !destinations.has(destination.externalId)) {
          destinations.set(destination.externalId, destination);
        }
      }

      if (bindings.length < pageLimit) {
        typeExhausted.add(typeId);
        break;
      }

      offset += pageLimit;
    }

    typeOffsets.set(typeId, offset);
    if (destinations.size >= limit) break;
  }

  while (destinations.size < limit && typeExhausted.size < DISCOVERY_TYPE_IDS.length) {
    for (const typeId of DISCOVERY_TYPE_IDS) {
      if (typeExhausted.has(typeId) || destinations.size >= limit) continue;

      const offset = typeOffsets.get(typeId) || 0;
      const pageLimit = Math.min(batchSize, limit - destinations.size);
      const params = new URLSearchParams({
        format: "json",
        query: discoveryQuery(typeId, pageLimit, offset),
      });
      let payload;

      try {
        payload = await fetchJson(`https://query.wikidata.org/sparql?${params}`, {
          cacheTtlMs: 6 * 60 * 60 * 1000,
        });
      } catch (error) {
        console.warn(`Skipping Wikidata category ${typeId} after provider failure: ${error.message}`);
        typeExhausted.add(typeId);
        continue;
      }
      const bindings = payload.results?.bindings || [];

      for (const binding of bindings) {
        const destination = normalizeDiscoveryBinding(binding);

        if (destination && !destinations.has(destination.externalId)) {
          destinations.set(destination.externalId, destination);
        }
      }

      if (bindings.length < pageLimit) {
        typeExhausted.add(typeId);
      } else {
        typeOffsets.set(typeId, offset + pageLimit);
      }
    }
  }

  return [...destinations.values()];
}

function claimValue(entity, property) {
  return entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
}

function normalizeExistingEntity(entity, current) {
  const coord = claimValue(entity, "P625");
  const elevation = Number(claimValue(entity, "P2044")?.amount);
  const imageValue = claimValue(entity, "P18");
  const name = entity.labels?.en?.value || current.name;
  const location = current.location || "Unknown";

  return {
    provider: "wikidata",
    externalId: entity.id,
    sourceUrl: `https://www.wikidata.org/wiki/${entity.id}`,
    licenseCode: WIKIDATA_LICENSE,
    attributionText: WIKIDATA_ATTRIBUTION,
    name,
    location,
    region: current.region,
    countryCode: current.country_code,
    continent: current.continent,
    latitude: coord?.latitude ?? current.latitude,
    longitude: coord?.longitude ?? current.longitude,
    elevationM: Number.isFinite(elevation) ? Math.round(elevation) : null,
    destinationType: current.destination_type || "mountain_resort",
    sourceTags: [(current.destination_type || "mountain_resort").replace(/_/g, "-"), "wikidata"],
    sourceDescription: entity.descriptions?.en?.value || current.source_description,
    description: factualDescription({
      name,
      location,
      region: current.region,
      elevationM: Number.isFinite(elevation) ? elevation : null,
      destinationType: current.destination_type || "mountain_resort",
    }),
    imageValue,
    rawPayload: entity,
  };
}

async function refreshExistingDestinations(sourceRows) {
  const destinations = [];

  for (let index = 0; index < sourceRows.length; index += 25) {
    const rows = sourceRows.slice(index, index + 25);
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      origin: "*",
      props: "labels|descriptions|claims",
      languages: "en",
      ids: rows.map((row) => row.external_id).join("|"),
    });
    const payload = await fetchJson(`https://www.wikidata.org/w/api.php?${params}`, {
      cacheTtlMs: 6 * 60 * 60 * 1000,
    });

    for (const row of rows) {
      const entity = payload.entities?.[row.external_id];

      if (entity && !entity.missing) {
        destinations.push(normalizeExistingEntity(entity, row));
      }
    }
  }

  return destinations;
}

module.exports = {
  discoverDestinations,
  refreshExistingDestinations,
};
