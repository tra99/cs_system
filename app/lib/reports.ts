import { neon } from "@neondatabase/serverless";
import { GROUPS } from "./groups";

export type CourseRecord = {
  courseId: string;
  title: string;
  score: number; // 0 - 100
  mark: string;  // Auto-calculated from score (A, A-, B+, B, C+, C, D, F)
  attempt: number;
  complete: number;
  tag: string;
};

export type AcademicYearBlock = {
  year: string;
  institution: string;
  grade: string;
  term: string;
  courses: CourseRecord[];
  creditAttempted: number;
  creditCompleted: number;
  gpa: number;
};

export type StudentTranscript = {
  email: string;
  name: string;
  studentId: string;
  stateId: string;
  gender: string;
  birthdate: string;
  track: string;
  sourceGroup: string;
  groupId: string;
  groupName: string;
  classYear: string;
  address: string;
  phone: string;
  districtEnter: string;
  schoolEnter: string;
  selectedAt: string | null;
  academicYears: AcademicYearBlock[];
  weightedGpa: number;
  unweightedGpa: number;
  classSize: number;
  classRank: number;
  totalAttemptedCredits: number;
  totalCompletedCredits: number;
  creditSummary: {
    subjectArea: string;
    reqd: number;
    compl: number;
    needed: number;
  }[];
};

export type GroupReportStat = {
  id: string;
  track: string;
  groupName: string;
  capacity: number;
  taken: number;
  remaining: number;
  accent: string;
  softAccent: string;
};

export type OverallStats = {
  totalRosterStudents: number;
  totalSelected: number;
  totalUnselected: number;
  totalCapacity: number;
  remainingSeats: number;
  fillPercentage: number;
};

export type ReportDataResult = {
  groups: GroupReportStat[];
  students: StudentTranscript[];
  stats: OverallStats;
};

type DbStudentRow = {
  email: string;
  name: string;
  track: string;
  sourceGroup: string;
  groupId: string;
  groupName: string;
  selectedAt: string | null;
};

// Calculate Grade Mark and Grade Points from 0 - 100 Score
export function calculateGrade(score: number): { mark: string; gradePoint: number } {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 90) return { mark: "A", gradePoint: 4.0 };
  if (s >= 85) return { mark: "A-", gradePoint: 3.7 };
  if (s >= 80) return { mark: "B+", gradePoint: 3.3 };
  if (s >= 75) return { mark: "B", gradePoint: 3.0 };
  if (s >= 70) return { mark: "C+", gradePoint: 2.3 };
  if (s >= 65) return { mark: "C", gradePoint: 2.0 };
  if (s >= 60) return { mark: "D", gradePoint: 1.0 };
  return { mark: "F", gradePoint: 0.0 };
}

// Recalculate Student GPA and Credits dynamically based on course scores
export function recalculateStudentTranscript(
  student: StudentTranscript,
  updatedCourses: CourseRecord[]
): StudentTranscript {
  const processedCourses: CourseRecord[] = updatedCourses.map((c) => {
    const { mark } = calculateGrade(c.score);
    const complete = c.score >= 60 ? c.attempt : 0;
    return {
      ...c,
      mark,
      complete,
    };
  });

  let totalPoints = 0;
  let totalAttempted = 0;
  let totalCompleted = 0;

  processedCourses.forEach((c) => {
    const { gradePoint } = calculateGrade(c.score);
    totalPoints += c.attempt * gradePoint;
    totalAttempted += c.attempt;
    if (c.score >= 60) {
      totalCompleted += c.attempt;
    }
  });

  const calculatedGpa = totalAttempted > 0 ? Number((totalPoints / totalAttempted).toFixed(4)) : 0;

  const updatedYears: AcademicYearBlock[] = student.academicYears.map((ay) => ({
    ...ay,
    courses: processedCourses,
    creditAttempted: totalAttempted,
    creditCompleted: totalCompleted,
    gpa: calculatedGpa,
  }));

  const updatedCreditSummary = student.creditSummary.map((cs) => {
    if (cs.subjectArea === "* TOTALS *") {
      return {
        ...cs,
        compl: totalCompleted + 125, // Base prior credits
        needed: Math.max(0, cs.reqd - (totalCompleted + 125)),
      };
    }
    return cs;
  });

  return {
    ...student,
    academicYears: updatedYears,
    weightedGpa: calculatedGpa,
    unweightedGpa: calculatedGpa,
    totalAttemptedCredits: totalAttempted,
    totalCompletedCredits: totalCompleted,
    creditSummary: updatedCreditSummary,
  };
}

// Default course rosters per track with numeric scores
const DS_COURSES: CourseRecord[] = [
  { courseId: "2711", title: "Data Structures & Alg Sm2", score: 91, mark: "A", attempt: 5.0, complete: 5.0, tag: "" },
  { courseId: "2720", title: "Applied Linear Algebra S1", score: 95, mark: "A", attempt: 5.0, complete: 5.0, tag: "" },
  { courseId: "2721", title: "Database Systems & SQL Sm2", score: 88, mark: "A-", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "0331", title: "Intro to Data Mining", score: 82, mark: "B+", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "0301", title: "Probability & Statistics", score: 94, mark: "A", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "0607", title: "Python for Data Science", score: 90, mark: "A", attempt: 5.0, complete: 5.0, tag: "*" },
];

const SE_COURSES: CourseRecord[] = [
  { courseId: "3101", title: "Software Architecture Sm1", score: 92, mark: "A", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "3102", title: "Web Application Dev Sm2", score: 87, mark: "A-", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "3103", title: "Object Oriented Design", score: 94, mark: "A", attempt: 5.0, complete: 5.0, tag: "" },
  { courseId: "0117", title: "Cloud Computing Fundamentals", score: 83, mark: "B+", attempt: 5.0, complete: 5.0, tag: "*" },
  { courseId: "0674", title: "DevOps & CI/CD Pipelines", score: 88, mark: "A-", attempt: 5.0, complete: 5.0, tag: "p" },
  { courseId: "0675", title: "Agile Project Management", score: 90, mark: "A", attempt: 5.0, complete: 5.0, tag: "" },
];

const DEFAULT_CREDIT_SUMMARY = [
  { subjectArea: "Computer Science Core", reqd: 40.0, compl: 35.0, needed: 5.0 },
  { subjectArea: "Software & Systems", reqd: 30.0, compl: 25.0, needed: 5.0 },
  { subjectArea: "Data & Analytics", reqd: 30.0, compl: 25.0, needed: 5.0 },
  { subjectArea: "Mathematics & Stats", reqd: 20.0, compl: 20.0, needed: 0.0 },
  { subjectArea: "Cloud & Security", reqd: 15.0, compl: 15.0, needed: 0.0 },
  { subjectArea: "Professional Practice", reqd: 10.0, compl: 10.0, needed: 0.0 },
  { subjectArea: "Capstone & Electives", reqd: 40.0, compl: 25.0, needed: 15.0 },
  { subjectArea: "* TOTALS *", reqd: 185.0, compl: 155.0, needed: 30.0 },
];

const FALLBACK_TRANSCRIPTS: StudentTranscript[] = [
  {
    email: "sok.vanna@student.cadt.edu.kh",
    name: "Sok Vanna",
    studentId: "0099400012",
    stateId: "0099400012",
    gender: "Female",
    birthdate: "12/01/2005",
    track: "Data Science",
    sourceGroup: "DS-A",
    groupId: "ds-1",
    groupName: "Group 1",
    classYear: "Class of 2026",
    address: "115 W Norgate St, Phnom Penh, Cambodia",
    phone: "(855) 12-555-782",
    districtEnter: "8/15/2022",
    schoolEnter: "8/22/2022",
    selectedAt: "2026-09-20 10:14:00",
    academicYears: [
      {
        year: "2025-2026",
        institution: "CADT Institute of Digital Technology",
        grade: "Year 3",
        term: "Fall",
        courses: DS_COURSES,
        creditAttempted: 30.0,
        creditCompleted: 30.0,
        gpa: 3.88,
      },
    ],
    weightedGpa: 3.88,
    unweightedGpa: 3.88,
    classSize: 180,
    classRank: 12,
    totalAttemptedCredits: 30.0,
    totalCompletedCredits: 30.0,
    creditSummary: DEFAULT_CREDIT_SUMMARY,
  },
  {
    email: "chan.thida@student.cadt.edu.kh",
    name: "Chan Thida",
    studentId: "0099400014",
    stateId: "0099400014",
    gender: "Female",
    birthdate: "05/14/2005",
    track: "Data Science",
    sourceGroup: "DS-A",
    groupId: "ds-1",
    groupName: "Group 1",
    classYear: "Class of 2026",
    address: "24 Monivong Blvd, Phnom Penh, Cambodia",
    phone: "(855) 12-888-999",
    districtEnter: "8/15/2022",
    schoolEnter: "8/22/2022",
    selectedAt: "2026-09-20 11:30:00",
    academicYears: [
      {
        year: "2025-2026",
        institution: "CADT Institute of Digital Technology",
        grade: "Year 3",
        term: "Fall",
        courses: DS_COURSES,
        creditAttempted: 30.0,
        creditCompleted: 30.0,
        gpa: 3.95,
      },
    ],
    weightedGpa: 3.95,
    unweightedGpa: 3.95,
    classSize: 180,
    classRank: 5,
    totalAttemptedCredits: 30.0,
    totalCompletedCredits: 30.0,
    creditSummary: DEFAULT_CREDIT_SUMMARY,
  },
  {
    email: "sovann.darith@student.cadt.edu.kh",
    name: "Sovann Darith",
    studentId: "0099400021",
    stateId: "0099400021",
    gender: "Male",
    birthdate: "09/20/2004",
    track: "Software Engineering",
    sourceGroup: "SE-A",
    groupId: "se-1",
    groupName: "Group 1",
    classYear: "Class of 2026",
    address: "88 Russian Blvd, Phnom Penh, Cambodia",
    phone: "(855) 16-777-333",
    districtEnter: "8/15/2022",
    schoolEnter: "8/22/2022",
    selectedAt: "2026-09-20 08:50:00",
    academicYears: [
      {
        year: "2025-2026",
        institution: "CADT Institute of Digital Technology",
        grade: "Year 3",
        term: "Fall",
        courses: SE_COURSES,
        creditAttempted: 30.0,
        creditCompleted: 30.0,
        gpa: 3.75,
      },
    ],
    weightedGpa: 3.75,
    unweightedGpa: 3.75,
    classSize: 180,
    classRank: 24,
    totalAttemptedCredits: 30.0,
    totalCompletedCredits: 30.0,
    creditSummary: DEFAULT_CREDIT_SUMMARY,
  },
  {
    email: "meng.cheatra@student.cadt.edu.kh",
    name: "Meng Cheatra",
    studentId: "0099400030",
    stateId: "0099400030",
    gender: "Male",
    birthdate: "03/11/2005",
    track: "Data Science",
    sourceGroup: "DS-B",
    groupId: "ds-2",
    groupName: "Group 2",
    classYear: "Class of 2026",
    address: "12 Mao Tse Toung Blvd, Phnom Penh",
    phone: "(855) 17-222-111",
    districtEnter: "8/15/2022",
    schoolEnter: "8/22/2022",
    selectedAt: "2026-09-21 09:05:00",
    academicYears: [
      {
        year: "2025-2026",
        institution: "CADT Institute of Digital Technology",
        grade: "Year 3",
        term: "Fall",
        courses: DS_COURSES,
        creditAttempted: 30.0,
        creditCompleted: 30.0,
        gpa: 3.60,
      },
    ],
    weightedGpa: 3.60,
    unweightedGpa: 3.60,
    classSize: 180,
    classRank: 45,
    totalAttemptedCredits: 30.0,
    totalCompletedCredits: 30.0,
    creditSummary: DEFAULT_CREDIT_SUMMARY,
  },
  {
    email: "phorn.reach@student.cadt.edu.kh",
    name: "Phorn Reach",
    studentId: "0099400045",
    stateId: "0099400045",
    gender: "Male",
    birthdate: "11/05/2004",
    track: "Software Engineering",
    sourceGroup: "SE-B",
    groupId: "se-2",
    groupName: "Group 2",
    classYear: "Class of 2026",
    address: "45 Preah Norodom Blvd, Phnom Penh",
    phone: "(855) 92-333-444",
    districtEnter: "8/15/2022",
    schoolEnter: "8/22/2022",
    selectedAt: "2026-09-21 10:15:00",
    academicYears: [
      {
        year: "2025-2026",
        institution: "CADT Institute of Digital Technology",
        grade: "Year 3",
        term: "Fall",
        courses: SE_COURSES,
        creditAttempted: 30.0,
        creditCompleted: 30.0,
        gpa: 3.82,
      },
    ],
    weightedGpa: 3.82,
    unweightedGpa: 3.82,
    classSize: 180,
    classRank: 18,
    totalAttemptedCredits: 30.0,
    totalCompletedCredits: 30.0,
    creditSummary: DEFAULT_CREDIT_SUMMARY,
  },
];

export async function getReportData(): Promise<ReportDataResult> {
  const dbStudents: DbStudentRow[] = [];
  const countsMap = new Map<string, number>();

  try {
    const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (databaseUrl) {
      const sql = neon(databaseUrl);

      const rows = (await sql`
        SELECT
          r.email,
          COALESCE(r.name, '') AS name,
          r.track,
          COALESCE(r.source_group, '') AS "sourceGroup",
          COALESCE(s.group_id, '') AS "groupId",
          COALESCE(s.group_name, '') AS "groupName",
          s.updated_at::text AS "selectedAt"
        FROM student_roster r
        LEFT JOIN student_group_selections s ON s.email = r.email
        ORDER BY r.track ASC, r.email ASC
      `) as DbStudentRow[];

      if (rows && rows.length > 0) {
        dbStudents.push(...rows);
      }

      const counts = (await sql`
        SELECT group_id AS "groupId", COUNT(*)::integer AS taken
        FROM student_group_selections
        WHERE group_id <> ''
        GROUP BY group_id
      `) as { groupId: string; taken: number }[];

      counts.forEach((c) => {
        countsMap.set(c.groupId, Number(c.taken));
      });
    }
  } catch (err) {
    console.error("Using transcript dataset fallback", err);
  }

  const students: StudentTranscript[] = [...FALLBACK_TRANSCRIPTS];

  if (dbStudents.length > 0) {
    dbStudents.forEach((dbs, idx) => {
      const existing = students.find((s) => s.email === dbs.email);
      if (existing) {
        existing.groupId = dbs.groupId;
        existing.groupName = dbs.groupName;
        existing.selectedAt = dbs.selectedAt;
      } else {
        students.push({
          email: dbs.email,
          name: dbs.name || dbs.email.split("@")[0].replace(".", " ").toUpperCase(),
          studentId: `0099400${100 + idx}`,
          stateId: `0099400${100 + idx}`,
          gender: idx % 2 === 0 ? "Female" : "Male",
          birthdate: "01/15/2005",
          track: dbs.track || "Software Engineering",
          sourceGroup: dbs.sourceGroup || "SE-A",
          groupId: dbs.groupId || "",
          groupName: dbs.groupName || "",
          classYear: "Class of 2026",
          address: "Phnom Penh, Cambodia",
          phone: "(855) 12-000-000",
          districtEnter: "8/15/2022",
          schoolEnter: "8/22/2022",
          selectedAt: dbs.selectedAt,
          academicYears: [
            {
              year: "2025-2026",
              institution: "CADT Institute of Digital Technology",
              grade: "Year 3",
              term: "Fall",
              courses: dbs.track === "Data Science" ? DS_COURSES : SE_COURSES,
              creditAttempted: 30.0,
              creditCompleted: 30.0,
              gpa: 3.75,
            },
          ],
          weightedGpa: 3.75,
          unweightedGpa: 3.75,
          classSize: 180,
          classRank: 20 + idx,
          totalAttemptedCredits: 30.0,
          totalCompletedCredits: 30.0,
          creditSummary: DEFAULT_CREDIT_SUMMARY,
        });
      }
    });
  }

  students.forEach((s) => {
    if (s.groupId) {
      countsMap.set(s.groupId, (countsMap.get(s.groupId) ?? 0) + 1);
    }
  });

  const groups: GroupReportStat[] = GROUPS.map((g) => {
    const taken = countsMap.get(g.id) ?? 0;
    return {
      id: g.id,
      track: g.track,
      groupName: g.groupName,
      capacity: g.capacity,
      taken,
      remaining: Math.max(g.capacity - taken, 0),
      accent: g.accent,
      softAccent: g.softAccent,
    };
  });

  const totalRosterStudents = students.length;
  const totalSelected = students.filter((s) => Boolean(s.groupId)).length;
  const totalUnselected = totalRosterStudents - totalSelected;
  const totalCapacity = groups.reduce((acc, g) => acc + g.capacity, 0);
  const totalTakenSeats = groups.reduce((acc, g) => acc + g.taken, 0);
  const remainingSeats = totalCapacity - totalTakenSeats;
  const fillPercentage = totalCapacity > 0 ? Math.round((totalTakenSeats / totalCapacity) * 100) : 0;

  return {
    groups,
    students,
    stats: {
      totalRosterStudents,
      totalSelected,
      totalUnselected,
      totalCapacity,
      remainingSeats,
      fillPercentage,
    },
  };
}
