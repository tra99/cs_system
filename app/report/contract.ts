export type ContractDuty = {
  id: string;
  itemEn: string;
  descriptionEn: string;
  itemKh: string;
  descriptionKh: string;
};

export type ContractProfile = {
  lecturerNameEn: string;
  lecturerNameKh: string;
  startDate: string; // yyyy-mm-dd from <input type="date">
  monthlySalary: number; // KHR
  months: number;
  subjectEn: string;
  subjectKh: string;
  year: number;
  term: number;
  generation: number;
  departmentEn: string;
  departmentKh: string;
  specializationEn: string;
  specializationKh: string;
  duties: ContractDuty[];
};

export const EN_CONTRACT_FONT = '"Times New Roman", Times, serif';
export const KH_CONTRACT_FONT = '"Khmer OS Siemreap", "Siemreap", "Noto Serif Khmer", serif';

// Shown in the printed contract wherever a field is still empty
export const BLANK = "..............................";

export const SPECIALIZATION_PRESETS = [
  { en: "Data Science", kh: "វិទ្យាសាស្ត្រទិន្នន័យ" },
  { en: "Software Engineering", kh: "វិស្វកម្មសូហ្វវែរ" },
];

export const DEFAULT_DUTIES: ContractDuty[] = [
  {
    id: "duty-1",
    itemEn: "Course Development",
    descriptionEn: "Provide new material syllabus following Blended Learning method",
    itemKh: "ការអភិវឌ្ឍមាតិកាមេរៀន",
    descriptionKh: "ផ្តល់នូវមាតិកាមេរៀន និងកម្មវិធីសិក្សាថ្មីតាមការបង្រៀនបែប Blended Learning",
  },
  {
    id: "duty-2",
    itemEn: "Providing Theory Online (1 week prior to the timetable)",
    descriptionEn:
      "Producing video lessons following CADT standard, providing study materials, instructions, and assignments",
    itemKh: "ការផ្ដល់មេរៀនអនឡាញ (១ សប្តាហ៍មុនតារាងពេលវេលា)",
    descriptionKh: "ផលិតវីដេអូមេរៀនតាមស្តង់ដារ CADT ផ្តល់សម្ភារៈសិក្សា ការណែនាំ និងកិច្ចការដល់និស្សិត",
  },
  {
    id: "duty-3",
    itemEn: "Offline Class Activities",
    descriptionEn: "Practices, labs, and on-campus activities",
    itemKh: "ការបង្រៀននៅក្នុងថ្នាក់",
    descriptionKh: "ដឹកនាំការអនុវត្ត មន្ទីរពិសោធន៍ និងសកម្មភាពផ្សេងៗនៅសាលា",
  },
  {
    id: "duty-4",
    itemEn: "Online discussion",
    descriptionEn: "Facilitating online Q&A with students",
    itemKh: "ការពិភាក្សាតាមអនឡាញ",
    descriptionKh: "ជួយសម្របសម្រួលការជជែកពិភាក្សា សួរសំណួរ និងផ្ដល់ចម្លើយដល់និស្សិតតាមអនឡាញ",
  },
  {
    id: "duty-5",
    itemEn: "Monthly meeting",
    descriptionEn: "Attending school meetings and workshops",
    itemKh: "កិច្ចប្រជុំប្រចាំខែ",
    descriptionKh: "ចូលរួមការប្រជុំប្រចាំខែ និងសិក្ខាសាលាផ្សេងៗ",
  },
  {
    id: "duty-6",
    itemEn: "Exam",
    descriptionEn: "Preparing exams and grading students",
    itemKh: "ប្រឡង",
    descriptionKh: "រៀបចំការប្រឡង កែវិញ្ញាសា និងដាក់ពិន្ទុដល់និស្សិត",
  },
  {
    id: "duty-7",
    itemEn: "Score evaluation",
    descriptionEn: "Evaluating students and giving feedback",
    itemKh: "វាយតម្លៃពិន្ទុ",
    descriptionKh: "វាយតម្លៃពិន្ទុ និងផ្តល់មតិយោបល់ទៅកាន់និស្សិត និងមហាវិទ្យាល័យ",
  },
];

export const DEFAULT_CONTRACT: ContractProfile = {
  lecturerNameEn: "",
  lecturerNameKh: "",
  startDate: "2026-01-05",
  monthlySalary: 2152500,
  months: 3,
  subjectEn: "",
  subjectKh: "",
  year: 3,
  term: 2,
  generation: 10,
  departmentEn: "Department of Computer Science",
  departmentKh: "ដេប៉ាតឺម៉ង់វិទ្យាសាស្ត្រកុំព្យូទ័រ",
  specializationEn: "Software Engineering",
  specializationKh: "វិស្វកម្មសូហ្វវែរ",
  duties: DEFAULT_DUTIES,
};

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const KH_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

export function formatKhr(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

export function toKhmerNumerals(value: string | number) {
  return String(value).replace(/[0-9]/g, (digit) => KHMER_DIGITS[Number(digit)]);
}

export function orBlank(value: string) {
  return value.trim() || BLANK;
}

function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function ordinalSuffix(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

// "2026-01-05" -> "5th January 2026"
export function formatDateEn(iso: string) {
  const date = parseIsoDate(iso);
  if (!date) return BLANK;
  return `${date.day}${ordinalSuffix(date.day)} ${EN_MONTHS[date.month - 1]} ${date.year}`;
}

// "2026-01-05" -> "ថ្ងៃទី៥ ខែមករា ឆ្នាំ២០២៦"
export function formatDateKh(iso: string) {
  const date = parseIsoDate(iso);
  if (!date) return BLANK;
  return `ថ្ងៃទី${toKhmerNumerals(date.day)} ខែ${KH_MONTHS[date.month - 1]} ឆ្នាំ${toKhmerNumerals(date.year)}`;
}

export function getTotalFee(profile: ContractProfile) {
  return profile.monthlySalary * profile.months;
}

// Fields that leave a blank line in the printed contract
export function getMissingFields(profile: ContractProfile) {
  const missing: string[] = [];
  if (!profile.lecturerNameEn.trim()) missing.push("Lecturer name");
  if (!profile.startDate) missing.push("Start date");
  if (!profile.subjectEn.trim()) missing.push("Subject");
  if (!profile.specializationEn.trim()) missing.push("Specialization");
  if (profile.monthlySalary <= 0) missing.push("Salary");
  if (profile.duties.length === 0) missing.push("Duties");
  return missing;
}
