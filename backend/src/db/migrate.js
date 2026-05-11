import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "..", "migrations");

const run = async () => {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    process.stdout.write(`▸ ${file} ... `);
    await pool.query(sql);
    console.log("ok");
  }
  await pool.end();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
