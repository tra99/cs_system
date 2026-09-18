import { neon } from "@neondatabase/serverless";
import {
  GROUPS,
  getGroupById,
  isCadtEmail,
  normalizeEmail,
} from "./groups";

export type StudentRecord = {
  email: string;
  name: string;
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

type StudentRow = {
  email: string;
  name: string;
  track: string;
  groupId: string;
  groupName: string;
  createdAt: string;
  updatedAt: string;
};

type GroupCountRow = {
  groupId: string;
  taken: number | string;
};

type ChooseGroupRow = {
  changed: boolean;
  alreadySelected: boolean;
  full: boolean;
};

let sqlClient: ReturnType<typeof neon> | undefined;
let setupPromise: Promise<void> | undefined;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL must be set.");
  }

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}

async function ensureDatabase() {
  if (!setupPromise) {
    setupPromise = (async () => {
      const sql = getSql();

      await sql`
        CREATE TABLE IF NOT EXISTS student_roster (
          email text PRIMARY KEY,
          name text NOT NULL DEFAULT '',
          track text NOT NULL,
          source_group text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS student_roster_track_idx
        ON student_roster (track)
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS student_group_selections (
          email text PRIMARY KEY,
          track text NOT NULL DEFAULT '',
          group_id text NOT NULL DEFAULT '',
          group_name text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS student_group_selections_group_id_idx
        ON student_group_selections (group_id)
        WHERE group_id <> ''
      `;
    })();
  }

  try {
    await setupPromise;
  } catch (error) {
    setupPromise = undefined;
    throw error;
  }
}

function mapStudent(row: StudentRow): StudentRecord {
  return {
    email: row.email,
    name: row.name,
    track: row.track,
    groupId: row.groupId,
    groupName: row.groupName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getStudent(email: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      roster.email,
      roster.name,
      roster.track,
      COALESCE(selection.group_id, '') AS "groupId",
      COALESCE(selection.group_name, '') AS "groupName",
      COALESCE(selection.created_at, roster.created_at)::text AS "createdAt",
      COALESCE(selection.updated_at, roster.updated_at)::text AS "updatedAt"
    FROM student_roster AS roster
    LEFT JOIN student_group_selections AS selection
      ON selection.email = roster.email
    WHERE roster.email = ${normalizeEmail(email)}
    LIMIT 1
  `) as StudentRow[];

  const row = rows[0];
  return row ? mapStudent(row) : undefined;
}

export async function saveStudentEmail(rawEmail: string) {
  const email = normalizeEmail(rawEmail);

  if (!isCadtEmail(email)) {
    return false;
  }

  await ensureDatabase();

  const sql = getSql();
  const rows = (await sql`
    WITH roster AS (
      SELECT email, track
      FROM student_roster
      WHERE email = ${email}
    ),
    saved AS (
      INSERT INTO student_group_selections (
        email,
        track,
        created_at,
        updated_at
      )
      SELECT
        email,
        track,
        now(),
        now()
      FROM roster
      ON CONFLICT (email) DO UPDATE
        SET
          track = CASE
            WHEN student_group_selections.group_id = ''
              THEN EXCLUDED.track
            ELSE student_group_selections.track
          END,
          updated_at = now()
      RETURNING 1
    )
    SELECT EXISTS(SELECT 1 FROM saved) AS "saved"
  `) as { saved: boolean }[];

  return rows[0]?.saved ?? false;
}

async function getRosterStudent(email: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      email,
      name,
      track,
      created_at::text AS "createdAt",
      updated_at::text AS "updatedAt"
    FROM student_roster
    WHERE email = ${normalizeEmail(email)}
    LIMIT 1
  `) as Pick<
    StudentRecord,
    "email" | "name" | "track" | "createdAt" | "updatedAt"
  >[];

  return rows[0];
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

  await ensureDatabase();

  const rosterStudent = await getRosterStudent(email);

  if (!rosterStudent) {
    return { ok: false, reason: "invalid-email" };
  }

  if (rosterStudent.track !== group.track) {
    return { ok: false, reason: "invalid-group" };
  }

  const sql = getSql();
  const rows = (await sql`
    WITH input AS (
      SELECT
        ${email}::text AS email,
        ${group.id}::text AS group_id,
        ${rosterStudent.track}::text AS track,
        ${group.groupName}::text AS group_name,
        ${group.capacity}::integer AS capacity
    ),
    lock_group AS (
      SELECT pg_advisory_xact_lock(
        hashtext('student_group_selections'),
        hashtext((SELECT group_id FROM input))
      )
    ),
    existing AS (
      SELECT s.group_id
      FROM student_group_selections AS s
      JOIN input AS i ON i.email = s.email
    ),
    group_counts AS (
      SELECT COUNT(*)::integer AS taken
      FROM student_group_selections AS s
      CROSS JOIN lock_group
      JOIN input AS i ON i.group_id = s.group_id
    ),
    saved AS (
      INSERT INTO student_group_selections (
        email,
        track,
        group_id,
        group_name,
        created_at,
        updated_at
      )
      SELECT
        email,
        track,
        group_id,
        group_name,
        now(),
        now()
      FROM input
      WHERE NOT EXISTS (
        SELECT 1
        FROM existing
        WHERE group_id <> ''
      )
      AND (SELECT taken FROM group_counts) < (SELECT capacity FROM input)
      ON CONFLICT (email) DO UPDATE
        SET
          track = EXCLUDED.track,
          group_id = EXCLUDED.group_id,
          group_name = EXCLUDED.group_name,
          updated_at = now()
      WHERE student_group_selections.group_id = ''
      AND (SELECT taken FROM group_counts) < (SELECT capacity FROM input)
      RETURNING 1
    )
    SELECT
      EXISTS(SELECT 1 FROM saved) AS "changed",
      EXISTS(
        SELECT 1
        FROM existing
        WHERE group_id <> ''
      ) AS "alreadySelected",
      (SELECT taken FROM group_counts) >= (SELECT capacity FROM input) AS "full"
  `) as ChooseGroupRow[];

  const result = rows[0];

  if (result?.changed) {
    return { ok: true };
  }

  if (result?.alreadySelected) {
    return { ok: false, reason: "already-selected" };
  }

  if (result?.full) {
    return { ok: false, reason: "full" };
  }

  return { ok: false, reason: "invalid-group" };
}

export async function getGroupSelectionData(email: string) {
  await ensureDatabase();

  const sql = getSql();
  const groupCountsPromise = (async () =>
    (await sql`
      SELECT
        group_id AS "groupId",
        COUNT(*)::integer AS taken
      FROM student_group_selections
      WHERE group_id <> ''
      GROUP BY group_id
    `) as GroupCountRow[])();

  const [student, groupCountRows] = await Promise.all([
    getStudent(email),
    groupCountsPromise,
  ]);

  const countsByGroup = new Map(
    groupCountRows.map((row) => [
      row.groupId,
      Number(row.taken),
    ]),
  );

  const groups = GROUPS.map((group) => {
    const taken = countsByGroup.get(group.id) ?? 0;

    return {
      ...group,
      taken,
      remaining: Math.max(group.capacity - taken, 0),
      isSelected: student?.groupId === group.id,
    };
  });

  return {
    student,
    groups: student
      ? groups.filter((group) => group.track === student.track)
      : [],
  };
}
