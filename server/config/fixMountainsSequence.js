const fs = require("fs").promises;
const path = require("path");
const pool = require("./db");

async function fixSequence() {
  try {
    const migrationPath = path.join(
      __dirname,
      "../db/migrations/fix_mountains_id_sequence.sql"
    );
    const sql = await fs.readFile(migrationPath, "utf8");

    await pool.query(sql);
    console.log("Mountains ID sequence fixed successfully");
  } catch (error) {
    console.error("Sequence fix failed:", error);
    process.exit(1);
  }
}

// Export for use in setup scripts
module.exports = fixSequence;

// Run directly if called from command line
if (require.main === module) {
  fixSequence().then(() => process.exit(0));
}
