const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function runSql() {
  const target = process.argv[2];

  if (!target) {
    throw new Error("Usage: node server/scripts/runSql.js <path-to-sql-file>");
  }

  const filePath = path.resolve(process.cwd(), target);
  const sql = fs.readFileSync(filePath, "utf8");

  await pool.query(sql);
  console.log(`Executed ${target}`);
}

runSql()
  .catch((error) => {
    console.error("SQL execution failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
