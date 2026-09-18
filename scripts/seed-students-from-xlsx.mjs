import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const DEFAULT_XLSX_PATH = "/Users/macusa/Desktop/Generation_12_Emails.xlsx";
const cadtEmailRegex = /^[A-Za-z0-9._%+-]+@student\.cadt\.edu\.kh$/i;
const trackByCode = new Map([
  ["DS", "Data Science"],
  ["SE", "Software Engineering"],
]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const xlsxPath =
  args.find((argument) => !argument.startsWith("--")) ?? DEFAULT_XLSX_PATH;

function parseEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n");
  }

  return trimmed;
}

async function loadLocalEnv() {
  let content = "";

  try {
    content = await readFile(".env.local", "utf8");
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readZipEntry(entryName) {
  try {
    return execFileSync("unzip", ["-p", xlsxPath, entryName], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function textFromRuns(xml) {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("");
}

function parseSharedStrings(xml) {
  if (!xml) {
    return [];
  }

  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    textFromRuns(match[1]),
  );
}

function columnIndex(reference) {
  const letters = reference.replace(/\d+/g, "");
  let index = 0;

  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }

  return index - 1;
}

function parseRows(sheetXml, sharedStrings) {
  return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(
    (rowMatch) => {
      const row = [];

      for (const cellMatch of rowMatch[1].matchAll(
        /<c\b([^>]*)>([\s\S]*?)<\/c>/g,
      )) {
        const attributes = cellMatch[1];
        const cellXml = cellMatch[2];
        const reference = /r="([^"]+)"/.exec(attributes)?.[1] ?? "";
        const type = /t="([^"]+)"/.exec(attributes)?.[1] ?? "";
        const valueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cellXml);
        let value = "";

        if (type === "inlineStr") {
          value = textFromRuns(cellXml);
        } else if (type === "s" && valueMatch) {
          value = sharedStrings[Number(valueMatch[1])] ?? "";
        } else if (valueMatch) {
          value = decodeXml(valueMatch[1]);
        }

        row[columnIndex(reference)] = value.trim();
      }

      return row;
    },
  );
}

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseStudents() {
  const sharedStrings = parseSharedStrings(readZipEntry("xl/sharedStrings.xml"));
  const sheetXml = readZipEntry("xl/worksheets/sheet1.xml");

  if (!sheetXml) {
    throw new Error(`Could not read xl/worksheets/sheet1.xml from ${xlsxPath}`);
  }

  const [headers = [], ...rows] = parseRows(sheetXml, sharedStrings);
  const normalizedHeaders = headers.map(normalizeHeader);
  const nameIndex = normalizedHeaders.indexOf("name");
  const emailIndex = normalizedHeaders.indexOf("email");
  const groupIndex = normalizedHeaders.indexOf("group");

  if (nameIndex < 0 || emailIndex < 0 || groupIndex < 0) {
    throw new Error("Expected workbook columns: Name, Email, Group.");
  }

  const studentsByEmail = new Map();
  const skipped = [];

  for (const [rowIndex, row] of rows.entries()) {
    const name = String(row[nameIndex] ?? "").trim();
    const email = String(row[emailIndex] ?? "")
      .trim()
      .toLowerCase();
    const sourceGroup = String(row[groupIndex] ?? "")
      .trim()
      .toUpperCase();
    const track = trackByCode.get(sourceGroup);
    const spreadsheetRow = rowIndex + 2;

    if (!name || !cadtEmailRegex.test(email) || !track) {
      skipped.push({ row: spreadsheetRow, email, group: sourceGroup });
      continue;
    }

    if (!studentsByEmail.has(email)) {
      studentsByEmail.set(email, {
        email,
        name,
        track,
        sourceGroup,
      });
    }
  }

  return {
    students: [...studentsByEmail.values()],
    skipped,
    duplicates: rows.length - skipped.length - studentsByEmail.size,
  };
}

async function ensureSchema(sql) {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS student_roster (
      email text PRIMARY KEY,
      name text NOT NULL DEFAULT '',
      track text NOT NULL,
      source_group text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await sql.query(`
    CREATE INDEX IF NOT EXISTS student_roster_track_idx
    ON student_roster (track)
  `);

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
}

const { students, skipped, duplicates } = parseStudents();
const counts = students.reduce(
  (result, student) => ({
    ...result,
    [student.track]: (result[student.track] ?? 0) + 1,
  }),
  {},
);

if (dryRun) {
  console.log(`Parsed ${students.length} student roster record(s).`);
  console.log(`Track counts: ${JSON.stringify(counts)}.`);

  if (duplicates > 0) {
    console.log(`Found ${duplicates} duplicate email row(s).`);
  }

  if (skipped.length > 0) {
    console.log(`Found ${skipped.length} invalid row(s).`);
  }

  process.exit(0);
}

await loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL must be set.");
}

const sql = neon(databaseUrl);

await ensureSchema(sql);

for (const student of students) {
  await sql.query(
    `
      INSERT INTO student_roster (
        email,
        name,
        track,
        source_group,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, now(), now())
      ON CONFLICT (email) DO UPDATE
        SET
          name = EXCLUDED.name,
          track = EXCLUDED.track,
          source_group = EXCLUDED.source_group,
          updated_at = now()
    `,
    [student.email, student.name, student.track, student.sourceGroup],
  );

  await sql.query(
    `
      INSERT INTO student_group_selections (
        email,
        track,
        created_at,
        updated_at
      )
      VALUES ($1, $2, now(), now())
      ON CONFLICT (email) DO UPDATE
        SET
          track = CASE
            WHEN student_group_selections.group_id = ''
              THEN EXCLUDED.track
            ELSE student_group_selections.track
          END
    `,
    [student.email, student.track],
  );
}

const rosterCounts = await sql.query(`
  SELECT
    track,
    COUNT(*)::integer AS count
  FROM student_roster
  GROUP BY track
  ORDER BY track
`);
const selectionCount = await sql.query(`
  SELECT COUNT(*)::integer AS count
  FROM student_group_selections AS selection
  JOIN student_roster AS roster
    ON roster.email = selection.email
`);

console.log(`Seeded ${students.length} student roster record(s).`);
console.log(`Track counts: ${JSON.stringify(counts)}.`);
console.log(`Database roster counts: ${JSON.stringify(rosterCounts)}.`);
console.log(
  `Database selection rows linked to roster: ${selectionCount[0]?.count ?? 0}.`,
);

if (duplicates > 0) {
  console.log(`Ignored ${duplicates} duplicate email row(s).`);
}

if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} invalid row(s).`);
}
