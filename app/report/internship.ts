export type InternshipStudent = {
  id: string;
  nameEn: string;
  nameKh: string;
  project: string;
  company: string;
};

export type InternshipDuty = {
  id: string;
  titleEn: string;
  titleKh: string;
  // One bullet per line; empty for a single-line duty
  bulletsEn: string;
  bulletsKh: string;
  hoursPerStudent: number;
};

export type InternshipProfile = {
  advisorNameEn: string;
  advisorNameKh: string;
  startDate: string; // yyyy-mm-dd from <input type="date">
  hourlyRateUsd: number; // USD per hour per student
  exchangeRate: number; // KHR per 1 USD
  term: number;
  internshipEn: string;
  internshipKh: string;
  generation: number;
  departmentEn: string;
  departmentKh: string;
  students: InternshipStudent[];
  duties: InternshipDuty[];
};

export const DEFAULT_EXCHANGE_RATE = 4100;

export const INTERNSHIP_PRESETS = [
  { en: "Internship I", kh: "កម្មសិក្សាលើកទី១", term: 6 },
  { en: "Internship II", kh: "កម្មសិក្សាលើកទី២", term: 9 },
];

export const DEFAULT_INTERNSHIP_DUTIES: InternshipDuty[] = [
  {
    id: "advisory",
    titleEn: "Advisory:",
    titleKh: "ការដឹកនាំ៖",
    bulletsEn: [
      "Validate student’s project scope",
      "Follow up student’s progress",
      "Advise, guide, and assist students when facing problem",
      "Guide student to produce report & slide",
      "Rehearsal",
      "Approve qualified student to defense",
      "Provide the evaluation of student",
      "Report student problem and progress to the program coordinator",
    ].join("\n"),
    bulletsKh: [
      "ធ្វើការវាយតម្លៃ និងកំណត់ទំហំគម្រោងការងាររបស់និស្សិត",
      "តាមដានដំណើរការរបស់និស្សិត",
      "ប្រឹក្សាយោបល់ ណែនាំ និងជួយនិស្សិតពេលជួបបញ្ហាផ្សេងៗ",
      "ដឹកនាំនិស្សិតធ្វើរបាយការណ៍ និងបទបង្ហាញ",
      "ណែនាំនិស្សិតហាត់សមក្នុងការធ្វើបទបង្ហាញ",
      "អនុញ្ញាតនិស្សិតដែលមានសមត្ថភាពគ្រប់គ្រាន់ឱ្យឡើងការពារ",
      "ផ្តល់ការវាយតម្លៃដល់និស្សិត",
      "រាយការណ៍ពីបញ្ហា និងវឌ្ឍនភាពរបស់និស្សិតទៅដល់អ្នកសម្របសម្រួលកម្មវិធី",
    ].join("\n"),
    hoursPerStudent: 8,
  },
  {
    id: "defense",
    titleEn: "Join judging panel of student’s oral defense",
    titleKh: "ចូលរួមជាគណៈកម្មការក្នុងការវាយតម្លៃការការពារបញ្ចប់របស់និស្សិត",
    bulletsEn: "",
    bulletsKh: "",
    hoursPerStudent: 2,
  },
];

export const DEFAULT_INTERNSHIP: InternshipProfile = {
  advisorNameEn: "",
  advisorNameKh: "",
  startDate: "2026-01-05",
  // $28 x 4,100 = 114,800 KHR/hour, as in the Gen 8 contract
  hourlyRateUsd: 28,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  term: 6,
  internshipEn: "Internship I",
  internshipKh: "កម្មសិក្សាលើកទី១",
  generation: 10,
  departmentEn: "Department of Computer Science",
  departmentKh: "ដេប៉ាតឺម៉ង់វិទ្យាសាស្ត្រកុំព្យូទ័រ",
  students: [{ id: "student-1", nameEn: "", nameKh: "", project: "", company: "" }],
  duties: DEFAULT_INTERNSHIP_DUTIES,
};

export function splitBullets(bullets: string) {
  return bullets
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getHoursPerStudent(profile: InternshipProfile) {
  return profile.duties.reduce((sum, duty) => sum + duty.hoursPerStudent, 0);
}

export function getTotalHours(profile: InternshipProfile) {
  return getHoursPerStudent(profile) * profile.students.length;
}

export function getHourlyRateKhr(profile: InternshipProfile) {
  return Math.round(profile.hourlyRateUsd * profile.exchangeRate);
}

export function getInternshipTotalUsd(profile: InternshipProfile) {
  return profile.hourlyRateUsd * getTotalHours(profile);
}

// Contract is paid in riel: USD rate x exchange rate x total hours
export function getInternshipTotal(profile: InternshipProfile) {
  return getHourlyRateKhr(profile) * getTotalHours(profile);
}

// Fields that leave a blank line in the printed contract
export function getInternshipMissingFields(profile: InternshipProfile) {
  const missing: string[] = [];
  if (!profile.advisorNameEn.trim()) missing.push("Advisor name");
  if (!profile.startDate) missing.push("Start date");
  if (profile.hourlyRateUsd <= 0) missing.push("Rate");
  if (profile.exchangeRate <= 0) missing.push("Exchange rate");
  if (profile.students.length === 0) missing.push("Students");
  else if (profile.students.some((student) => !student.nameEn.trim())) missing.push("Student name");
  if (profile.duties.length === 0) missing.push("Duties");
  return missing;
}
