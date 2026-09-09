import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const csvPath = process.argv[2] ?? "data/students.csv";
const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const cadtEmailRegex = /^[A-Za-z0-9._%+-]+@student\.cadt\.edu\.kh$/i;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL must be set.");
}

function parseCsv(content) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (quoted) {
      if (character === '"' && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        currentValue += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      currentRow.push(currentValue);
      currentValue = "";
    } else if (character === "\n") {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    } else if (character !== "\r") {
      currentValue += character;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

const sql = neon(databaseUrl);

await sql.query(`
  CREATE TABLE IF NOT EXISTS student_group_selections (
    email text PRIMARY KEY,
    track text NOT NULL DEFAULT '',
    group_id text NOT NULL DEFAULT '',
    group_name text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`);

await sql.query(`
  CREATE INDEX IF NOT EXISTS student_group_selections_group_id_idx
  ON student_group_selections (group_id)
  WHERE group_id <> ''
`);

const content = await readFile(csvPath, "utf8");
const [, ...rows] = parseCsv(content);
let migrated = 0;
let skipped = 0;

for (const row of rows) {
  const email = String(row[0] ?? "").trim().toLowerCase();

  if (!cadtEmailRegex.test(email)) {
    skipped += 1;
    continue;
  }

  await sql.query(
    `
      INSERT INTO student_group_selections (
        email,
        track,
        group_id,
        group_name,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        COALESCE(NULLIF($5, '')::timestamptz, now()),
        COALESCE(NULLIF($6, '')::timestamptz, now())
      )
      ON CONFLICT (email) DO UPDATE
        SET
          track = EXCLUDED.track,
          group_id = EXCLUDED.group_id,
          group_name = EXCLUDED.group_name,
          updated_at = EXCLUDED.updated_at
    `,
    [
      email,
      row[1] ?? "",
      row[2] ?? "",
      row[3] ?? "",
      row[4] ?? "",
      row[5] ?? "",
    ],
  );

  migrated += 1;
}

console.log(`Migrated ${migrated} CSV record(s) to Postgres.`);

if (skipped > 0) {
  console.log(`Skipped ${skipped} invalid CSV row(s).`);
}
