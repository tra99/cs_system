import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GROUP_CAPACITY,
  GROUPS,
  getGroupById,
  isCadtEmail,
  normalizeEmail,
} from "./groups";

export type StudentRecord = {
  email: string;
  track: string;
  groupId: string;
  groupName: string;
  createdAt: string;
  updatedAt: string;
};

type ChooseGroupResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid-email" | "invalid-group" | "full" | "already-selected";
    };

const csvHeaders = [
  "email",
  "track",
  "groupId",
  "groupName",
  "createdAt",
  "updatedAt",
] as const;

const csvPath = path.join(process.cwd(), "data", "students.csv");
let writeQueue = Promise.resolve();

async function withWriteLock<T>(operation: () => Promise<T>) {
  const run = writeQueue.then(operation, operation);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureCsvFile() {
  await mkdir(path.dirname(csvPath), { recursive: true });

  try {
    await readFile(csvPath, "utf8");
  } catch {
    await writeFile(csvPath, `${csvHeaders.join(",")}\n`, "utf8");
  }
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
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

function formatCsvValue(value: string) {
  const normalized = value.replace(/\r?\n/g, " ");

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

function formatRecords(records: StudentRecord[]) {
  const body = records.map((record) =>
    csvHeaders
      .map((header) => formatCsvValue(record[header]))
      .join(","),
  );

  return `${csvHeaders.join(",")}\n${body.join("\n")}${body.length ? "\n" : ""}`;
}

async function readRecordsUnlocked() {
  await ensureCsvFile();
  const content = await readFile(csvPath, "utf8");
  const [, ...rows] = parseCsv(content);

  return rows
    .filter((row) => row.some((value) => value.trim()))
    .map<StudentRecord>((row) => ({
      email: row[0] ?? "",
      track: row[1] ?? "",
      groupId: row[2] ?? "",
      groupName: row[3] ?? "",
      createdAt: row[4] ?? "",
      updatedAt: row[5] ?? "",
    }));
}

async function writeRecordsUnlocked(records: StudentRecord[]) {
  await ensureCsvFile();
  await writeFile(csvPath, formatRecords(records), "utf8");
}

function findStudent(records: StudentRecord[], email: string) {
  const normalizedEmail = normalizeEmail(email);
  return records.find(
    (record) => normalizeEmail(record.email) === normalizedEmail,
  );
}

export async function saveStudentEmail(rawEmail: string) {
  const email = normalizeEmail(rawEmail);

  if (!isCadtEmail(email)) {
    return false;
  }

  await withWriteLock(async () => {
    const records = await readRecordsUnlocked();
    const existingRecord = findStudent(records, email);
    const now = new Date().toISOString();

    if (existingRecord) {
      existingRecord.updatedAt = now;
    } else {
      records.push({
        email,
        track: "",
        groupId: "",
        groupName: "",
        createdAt: now,
        updatedAt: now,
      });
    }

    await writeRecordsUnlocked(records);
  });

  return true;
}

export async function chooseStudentGroup(
  rawEmail: string,
  rawGroupId: string,
): Promise<ChooseGroupResult> {
  const email = normalizeEmail(rawEmail);
  const group = getGroupById(rawGroupId);

  if (!isCadtEmail(email)) {
    return { ok: false, reason: "invalid-email" };
  }

  if (!group) {
    return { ok: false, reason: "invalid-group" };
  }

  return withWriteLock(async () => {
    const records = await readRecordsUnlocked();
    const existingRecord = findStudent(records, email);

    if (existingRecord?.groupId) {
      return { ok: false, reason: "already-selected" };
    }

    const takenByOthers = records.filter(
      (record) =>
        record.groupId === group.id && normalizeEmail(record.email) !== email,
    ).length;

    if (takenByOthers >= GROUP_CAPACITY) {
      return { ok: false, reason: "full" };
    }

    const now = new Date().toISOString();
    const nextRecord = existingRecord ?? {
      email,
      track: "",
      groupId: "",
      groupName: "",
      createdAt: now,
      updatedAt: now,
    };

    nextRecord.track = group.track;
    nextRecord.groupId = group.id;
    nextRecord.groupName = group.groupName;
    nextRecord.updatedAt = now;

    if (!existingRecord) {
      records.push(nextRecord);
    }

    await writeRecordsUnlocked(records);
    return { ok: true };
  });
}

export async function getGroupSelectionData(email: string) {
  const records = await readRecordsUnlocked();
  const student = findStudent(records, email);
  const groups = GROUPS.map((group) => {
    const taken = records.filter(
      (record) => record.groupId === group.id,
    ).length;

    return {
      ...group,
      capacity: GROUP_CAPACITY,
      taken,
      remaining: Math.max(GROUP_CAPACITY - taken, 0),
      isSelected: student?.groupId === group.id,
    };
  });

  return {
    student,
    groups,
  };
}
