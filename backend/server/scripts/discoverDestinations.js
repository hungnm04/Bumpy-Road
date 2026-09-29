const {
  completeRun,
  createRun,
  getWikidataSources,
  pool,
  upsertDestination,
} = require("../ingestion/catalogRepository");
const { discoverDestinations, refreshExistingDestinations } = require("../ingestion/wikidata");
const { getCommonsMedia } = require("../ingestion/wikimedia");

function parseArgs(args) {
  const options = {
    dryRun: args.includes("--dry-run"),
    existingOnly: args.includes("--existing-only"),
    limit: 200,
    batchSize: 100,
  };
  const limitArg = args.find((arg) => arg.startsWith("--limit="));

  if (limitArg) {
    options.limit = Math.min(Math.max(Number(limitArg.split("=")[1]) || 200, 1), 2000);
  }

  const batchSizeArg = args.find((arg) => arg.startsWith("--batch-size="));

  if (batchSizeArg) {
    options.batchSize = Math.min(Math.max(Number(batchSizeArg.split("=")[1]) || 100, 10), 200);
  }

  return options;
}

async function loadDestinations(options) {
  if (!options.existingOnly) {
    return discoverDestinations(options.limit, options.batchSize);
  }

  const sources = await getWikidataSources();
  return refreshExistingDestinations(sources.slice(0, options.limit));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const mode = options.existingOnly ? "refresh-existing" : "discover";
  const destinations = await loadDestinations(options);
  const counts = { fetched: destinations.length, staged: 0, updated: 0, skipped: 0 };
  const errors = [];
  let runId = null;

  if (!options.dryRun) {
    runId = await createRun(mode);
  }

  for (const destination of destinations) {
    try {
      const media = destination.imageValue
        ? await getCommonsMedia(destination.imageValue)
        : null;

      if (options.dryRun) {
        console.log(
          `[dry-run] ${destination.externalId}: ${destination.name} (${destination.location})`
        );
        continue;
      }

      const result = await upsertDestination(destination, media, {
        existingOnly: options.existingOnly,
      });
      counts[result] += 1;
    } catch (error) {
      errors.push({
        externalId: destination.externalId,
        message: error.message,
      });
      console.error(`Failed to ingest ${destination.externalId}: ${error.message}`);
    }
  }

  if (runId) {
    await completeRun(runId, "completed", counts, errors);
  }

  console.log(
    JSON.stringify(
      {
        mode,
        dryRun: options.dryRun,
        ...counts,
        errors: errors.length,
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error("Destination ingestion failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
