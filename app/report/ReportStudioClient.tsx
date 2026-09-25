"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import {
  ReportDataResult,
  StudentTranscript,
  CourseRecord,
  recalculateStudentTranscript,
  calculateGrade,
} from "../lib/reports";
import {
  ArrowLeft,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  Calculator,
  Plus,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import { ContractEditor } from "./ContractEditor";
import {
  BLANK,
  ContractProfile,
  DEFAULT_CONTRACT,
  EN_CONTRACT_FONT,
  KH_CONTRACT_FONT,
  formatDateEn,
  formatDateKh,
  formatKhr,
  getTotalFee,
  orBlank,
  toKhmerNumerals,
} from "./contract";

const CONTRACT_DRAFT_KEY = "cadt-contract-draft";

type DocumentType = "transcript" | "contract";

function getDocumentLabel(documentType: DocumentType) {
  if (documentType === "contract") return "Contract EN-KH";
  return "Transcript";
}

export function ReportStudioClient({ data }: { data: ReportDataResult }) {
  const printRef = useRef<HTMLDivElement>(null);

  // Selected Student
  const [selectedStudentEmail, setSelectedStudentEmail] = useState<string>(
    data.students[0]?.email ?? ""
  );
  const [documentType, setDocumentType] = useState<DocumentType>("transcript");

  // Local state of student transcripts to allow dynamic score & subject title edits
  const [studentsData, setStudentsData] = useState<StudentTranscript[]>(data.students);

  const [contractProfile, setContractProfile] = useState<ContractProfile>(DEFAULT_CONTRACT);

  // Restore the contract draft after mount so server and client render the same markup
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONTRACT_DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setContractProfile({ ...DEFAULT_CONTRACT, ...JSON.parse(saved) });
    } catch {
      // Storage blocked or draft corrupt: keep defaults
    }
  }, []);

  const handleContractChange = (profile: ContractProfile) => {
    setContractProfile(profile);
    try {
      window.localStorage.setItem(CONTRACT_DRAFT_KEY, JSON.stringify(profile));
    } catch {
      // Storage unavailable: draft lives only in memory
    }
  };

  const handleContractReset = () => {
    handleContractChange(DEFAULT_CONTRACT);
  };

  // Toggle Editor Drawer
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Form inputs for adding a new custom course (using strings for reliable typing)
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCourseCode, setNewCourseCode] = useState<string>("");
  const [newScoreInput, setNewScoreInput] = useState<string>("85");
  const [newCreditsInput, setNewCreditsInput] = useState<string>("5.0");

  // Find active student record
  const baseStudent =
    studentsData.find((s) => s.email === selectedStudentEmail) ??
    studentsData[0];

  const activeCourses = baseStudent.academicYears[0]?.courses ?? [];
  const isTranscript = documentType === "transcript";
  const documentLabel = getDocumentLabel(documentType);

  // Update properties of an existing course
  const handleUpdateCourse = (
    courseIndex: number,
    field: keyof CourseRecord,
    rawValue: string
  ) => {
    const updatedCourses = activeCourses.map((course, idx) => {
      if (idx === courseIndex) {
        if (field === "score") {
          const parsed = parseFloat(rawValue);
          const score = Math.max(0, Math.min(100, isNaN(parsed) ? 0 : parsed));
          const { mark } = calculateGrade(score);
          const complete = score >= 60 ? course.attempt : 0;
          return { ...course, score, mark, complete };
        }
        if (field === "attempt") {
          const parsed = parseFloat(rawValue);
          const attempt = Math.max(0.5, Math.min(20, isNaN(parsed) ? 1 : parsed));
          const complete = course.score >= 60 ? attempt : 0;
          return { ...course, attempt, complete };
        }
        return { ...course, [field]: rawValue };
      }
      return course;
    });

    const recalculatedStudent = recalculateStudentTranscript(baseStudent, updatedCourses);

    setStudentsData((prev) =>
      prev.map((s) => (s.email === baseStudent.email ? recalculatedStudent : s))
    );
  };

  // Add New Custom Subject Course
  const handleAddCustomCourse = (e: React.FormEvent) => {
    e.preventDefault();

    const title = newTitle.trim() || `Custom Subject ${activeCourses.length + 1}`;
    const courseId = newCourseCode.trim() || `CS-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedScore = parseFloat(newScoreInput);
    const score = Math.max(0, Math.min(100, isNaN(parsedScore) ? 85 : parsedScore));
    const parsedCredits = parseFloat(newCreditsInput);
    const attempt = Math.max(0.5, Math.min(20, isNaN(parsedCredits) ? 5.0 : parsedCredits));
    const { mark } = calculateGrade(score);
    const complete = score >= 60 ? attempt : 0;

    const newCourse: CourseRecord = {
      courseId,
      title,
      score,
      mark,
      attempt,
      complete,
      tag: "p",
    };

    const updatedCourses = [...activeCourses, newCourse];
    const recalculatedStudent = recalculateStudentTranscript(baseStudent, updatedCourses);

    setStudentsData((prev) =>
      prev.map((s) => (s.email === baseStudent.email ? recalculatedStudent : s))
    );

    // Reset form inputs
    setNewTitle("");
    setNewCourseCode("");
    setNewScoreInput("85");
    setNewCreditsInput("5.0");
  };

  // Remove Course
  const handleRemoveCourse = (courseIndex: number) => {
    if (activeCourses.length <= 1) return;
    const updatedCourses = activeCourses.filter((_, idx) => idx !== courseIndex);
    const recalculatedStudent = recalculateStudentTranscript(baseStudent, updatedCourses);

    setStudentsData((prev) =>
      prev.map((s) => (s.email === baseStudent.email ? recalculatedStudent : s))
    );
  };

  // Reset to original dataset
  const handleResetScores = () => {
    const original = data.students.find((s) => s.email === baseStudent.email);
    if (original) {
      setStudentsData((prev) =>
        prev.map((s) => (s.email === baseStudent.email ? original : s))
      );
    }
  };

  // Export PNG Image
  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(printRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      const fileOwner = isTranscript ? baseStudent.name : contractProfile.lecturerNameEn.trim() || "Lecturer";
      link.download = `CADT_${documentLabel.replace(/\s+/g, "_")}_${fileOwner.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate report image", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export CSV Data
  const handleExportCSV = () => {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Track",
      "Group Selected",
      "Course ID",
      "Course Title",
      "Score",
      "Mark",
      "Attempted Credits",
      "Completed Credits",
      "Calculated GPA",
    ];

    const rows: string[][] = [];
    studentsData.forEach((s) => {
      s.academicYears.forEach((ay) => {
        ay.courses.forEach((c) => {
          rows.push([
            `"${s.studentId}"`,
            `"${s.name}"`,
            `"${s.email}"`,
            `"${s.track}"`,
            `"${s.groupName || "Unassigned"}"`,
            `"${c.courseId}"`,
            `"${c.title}"`,
            `"${c.score}"`,
            `"${c.mark}"`,
            `"${c.attempt}"`,
            `"${c.complete}"`,
            `"${s.weightedGpa.toFixed(4)}"`,
          ]);
        });
      });
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CADT_Calculated_Scores_Transcript.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800 flex flex-col">
      {/* Top Controls Header (Hidden on Print) */}
      <header className="print:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center size-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Back to Option Page"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Report Generator
              </h1>
              <p className="text-xs text-slate-500">
                Generate transcript reports or lecturer contract documents
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-0 sm:mr-2">
              <FileText className="size-4 text-[#0d6f66]" />
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0d6f66]"
              >
                <option value="transcript">Transcript Report</option>
                <option value="contract">Contract (EN + KH)</option>
              </select>
            </div>

            {/* Student Selector */}
            {isTranscript && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <span className="text-xs font-semibold text-slate-500">Student:</span>
                <select
                  value={selectedStudentEmail}
                  onChange={(e) => setSelectedStudentEmail(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#0d6f66]"
                >
                  {studentsData.map((s) => (
                    <option key={s.email} value={s.email}>
                      {s.name} ({s.track} • GPA: {s.weightedGpa.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowEditor(!showEditor)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  showEditor
                    ? "border-[#0d6f66] bg-[#0d6f66]/10 text-[#0d6f66]"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <SlidersHorizontal className="size-4" />
                <span>
                  {showEditor ? "Hide Panel" : isTranscript ? "Edit Course & Scores" : "Edit Contract"}
                </span>
              </button>

            {isTranscript && (
              <button
                onClick={handleExportCSV}
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="size-4 text-blue-600" />
              <span>{isExporting ? "Saving..." : "Download PNG"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d6f66] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#095750] transition"
            >
              <Printer className="size-4" />
              <span>Print {documentLabel}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 py-8 px-4 sm:px-6 mx-auto w-full max-w-7xl grid gap-8 lg:grid-cols-12">

        {/* INTERACTIVE SUBJECT & SCORE INPUT PANEL (Left Sidebar) */}
        {showEditor && isTranscript && (
          <aside className="print:hidden lg:col-span-4 space-y-4">
            {/* Student Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calculator className="size-5 text-[#0d6f66]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Subject & Score Manager
                  </h2>
                </div>
                <button
                  onClick={handleResetScores}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
                  title="Reset to default courses & scores"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Student Summary Badge */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                  <span>{baseStudent.name}</span>
                  <span className="text-[#0d6f66] font-mono">{baseStudent.track}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Calculated GPA:</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    {baseStudent.weightedGpa.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">Completed Credits:</span>
                  <span className="font-semibold text-slate-700">
                    {baseStudent.totalCompletedCredits.toFixed(2)} / {baseStudent.totalAttemptedCredits.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dynamic Course & Score List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Subject List & Input Scores
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{activeCourses.length} Courses</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {activeCourses.map((course, idx) => {
                    const gradeInfo = calculateGrade(course.score);
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 hover:border-[#0d6f66]/40 transition shadow-sm"
                      >
                        {/* Course Name & Delete Button */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Course Name / Title</label>
                            <input
                              type="text"
                              value={course.title}
                              onChange={(e) => handleUpdateCourse(idx, "title", e.target.value)}
                              placeholder="Subject Name..."
                              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:border-[#0d6f66] focus:bg-white"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveCourse(idx)}
                            className="text-slate-400 hover:text-red-600 transition p-1 mt-3"
                            title="Remove Course"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* Course Code, Score, Mark, Credits Row */}
                        <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-slate-100">
                          {/* Course Code */}
                          <div className="col-span-3">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Code</label>
                            <input
                              type="text"
                              value={course.courseId}
                              onChange={(e) => handleUpdateCourse(idx, "courseId", e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#0d6f66]"
                            />
                          </div>

                          {/* Score Input */}
                          <div className="col-span-3">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Score (0-100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={course.score}
                              onChange={(e) => handleUpdateCourse(idx, "score", e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-1 text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#0d6f66] focus:bg-white"
                            />
                          </div>

                          {/* Calculated Mark */}
                          <div className="col-span-3 text-center">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Mark</label>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                course.score >= 80
                                  ? "bg-emerald-100 text-emerald-800"
                                  : course.score >= 60
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {gradeInfo.mark}
                            </span>
                          </div>

                          {/* Credits */}
                          <div className="col-span-3 text-right">
                            <label className="text-[10px] text-slate-400 block mb-0.5">Credits</label>
                            <input
                              type="number"
                              min="1"
                              max="15"
                              step="0.5"
                              value={course.attempt}
                              onChange={(e) => handleUpdateCourse(idx, "attempt", e.target.value)}
                              className="w-full text-right rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-1 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-[#0d6f66]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FORM: Add New Custom Subject Course */}
              <form onSubmit={handleAddCustomCourse} className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <BookOpen className="size-4 text-[#0d6f66]" />
                  <span>Add Custom Subject Course</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Subject Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Artificial Intelligence Sm1"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#0d6f66]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Code</label>
                      <input
                        type="text"
                        placeholder="CS-401"
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-[#0d6f66]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={newScoreInput}
                        onChange={(e) => setNewScoreInput(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-[#0d6f66]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        step="0.5"
                        value={newCreditsInput}
                        onChange={(e) => setNewCreditsInput(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-[#0d6f66]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0d6f66] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#08554e] transition"
                >
                  <Plus className="size-4" />
                  <span>Add Subject to Transcript</span>
                </button>
              </form>

              {/* Conversion rules legend */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1 font-mono">
                <p className="font-bold text-slate-700">Grade Conversion Rules:</p>
                <p>90-100: A (4.0) • 85-89: A- (3.7) • 80-84: B+ (3.3)</p>
                <p>75-79: B (3.0) • 70-74: C+ (2.3) • 65-69: C (2.0)</p>
                <p>60-64: D (1.0) • &lt;60: F (0.0 Fail)</p>
              </div>
            </div>
          </aside>
        )}

        {/* CONTRACT DETAILS INPUT PANEL (Left Sidebar) */}
        {showEditor && !isTranscript && (
          <aside className="print:hidden lg:col-span-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            <ContractEditor
              profile={contractProfile}
              onChange={handleContractChange}
              onReset={handleContractReset}
            />
          </aside>
        )}

        {/* OFFICIAL TRANSCRIPT DOCUMENT PREVIEW (Right Canvas) */}
        <main
          className={`${
            showEditor ? "lg:col-span-8" : "lg:col-span-12"
          } flex flex-col items-center justify-start overflow-x-auto`}
        >

          {isTranscript ? (
            /* OFFICIAL TRANSCRIPT DOCUMENT (Strict 1-Column Format matching user sample) */
            <div
              ref={printRef}
              id="report-document"
              className="w-full bg-white p-8 sm:p-12 text-black border border-slate-300 shadow-2xl rounded-sm print:shadow-none print:border-none print:p-0 print:m-0 font-serif"
              style={{ maxWidth: "800px" }}
            >

            {/* DOCUMENT HEADER */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold tracking-tight text-black mb-4">
                Enhanced (1-Column) Transcript
              </h1>

              <div className="flex justify-between items-start text-left text-sm leading-snug">
                <div>
                  <p className="font-bold text-base">CADT Institute of Digital Technology</p>
                  <p>Bridge 2, National Road 6A, Prek Leap</p>
                  <p>Chroy Changvar, Phnom Penh, Cambodia</p>
                  <p className="mt-2">(+855) 23 999 888</p>
                </div>

                <div className="text-right">
                  <p className="font-bold">County District School#</p>
                  <p>65-99999-8</p>
                  <p className="mt-4 font-semibold">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* STUDENT BIOGRAPHICAL BLOCK */}
            <div className="my-6 border-t border-b border-black py-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">{baseStudent.name}</p>
                  <p className="text-sm">CADT Student Roster</p>
                  <p className="text-sm">{baseStudent.address}</p>
                  <p className="text-sm mt-2">{baseStudent.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{baseStudent.classYear}</p>
                  <p className="text-xs mt-2">
                    <span className="font-semibold">District Enter:</span> {baseStudent.districtEnter}
                  </p>
                  <p className="text-xs">
                    <span className="font-semibold">School Enter:</span> {baseStudent.schoolEnter}
                  </p>
                </div>
              </div>

              {/* Metadata Table */}
              <div className="grid grid-cols-8 gap-1 text-xs border border-black p-2 bg-slate-50 font-sans">
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Grade</p>
                  <p className="font-semibold">Year 3</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Gender</p>
                  <p>{baseStudent.gender}</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Birthdate</p>
                  <p>{baseStudent.birthdate}</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Ethnicity</p>
                  <p>Asian/Khmer</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Race</p>
                  <p>Cambodian</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Student ID</p>
                  <p className="font-mono">{baseStudent.studentId}</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">State ID#</p>
                  <p className="font-mono">{baseStudent.stateId}</p>
                </div>
                <div>
                  <p className="font-bold text-[10px] uppercase text-slate-600">Birthplace</p>
                  <p>Cambodia</p>
                </div>
              </div>
            </div>

            {/* ACADEMIC COURSE & SCORE ALLOCATION TABLES */}
            {baseStudent.academicYears.map((ay, yearIdx) => (
              <div key={yearIdx} className="mb-6 border border-black font-sans">
                {/* Year Banner Header */}
                <div className="flex justify-between items-center bg-slate-100 border-b border-black px-3 py-1.5 text-xs font-bold">
                  <span className="w-24">{ay.year}</span>
                  <span className="flex-1 text-left">{ay.institution}</span>
                  <span className="w-24 text-right">{ay.grade} • {ay.term}</span>
                </div>

                {/* Course & Score Table Header */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-50 text-[11px]">
                      <th className="py-1 px-3 w-16">Crs ID</th>
                      <th className="py-1 px-3">Course / Track Title</th>
                      <th className="py-1 px-3 w-16 text-center">Score</th>
                      <th className="py-1 px-3 w-16 text-center">Mark</th>
                      <th className="py-1 px-3 w-16 text-center">Attempt</th>
                      <th className="py-1 px-3 w-16 text-center">Complete</th>
                      <th className="py-1 px-3 w-14 text-right">Tag(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                    {ay.courses.map((course, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-3">{course.courseId}</td>
                        <td className="py-1 px-3 font-sans font-medium">{course.title}</td>

                        {/* Interactive / Print Score */}
                        <td className="py-1 px-3 text-center font-bold">
                          <span className="print:inline hidden font-mono">{course.score.toFixed(1)}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={course.score}
                            onChange={(e) => handleUpdateCourse(idx, "score", e.target.value)}
                            className="print:hidden w-14 text-center rounded border border-slate-300 bg-slate-50 py-0.5 font-bold font-mono outline-none focus:border-[#0d6f66] focus:bg-white"
                          />
                        </td>

                        {/* Calculated Mark */}
                        <td className="py-1 px-3 text-center font-bold">
                          <span
                            className={
                              course.score >= 80
                                ? "text-emerald-800"
                                : course.score >= 60
                                ? "text-blue-800"
                                : "text-red-700"
                            }
                          >
                            {course.mark}
                          </span>
                        </td>

                        <td className="py-1 px-3 text-center">{course.attempt.toFixed(2)}</td>
                        <td className="py-1 px-3 text-center">{course.complete.toFixed(2)}</td>
                        <td className="py-1 px-3 text-right">{course.tag || "-"}</td>
                      </tr>
                    ))}

                    {/* Assigned Student Group Selection Row */}
                    <tr className="bg-emerald-50/70 border-t border-black font-sans font-semibold text-xs">
                      <td className="py-1.5 px-3 font-mono">GRP-12</td>
                      <td className="py-1.5 px-3 text-[#0d6f66]">
                        Major Group Allocation: {baseStudent.track} — {baseStudent.groupName || "Unassigned"}
                      </td>
                      <td className="py-1.5 px-3 text-center font-mono font-bold text-emerald-800">--</td>
                      <td className="py-1.5 px-3 text-center text-emerald-700 font-bold">
                        {baseStudent.groupId ? "PASS" : "PEND"}
                      </td>
                      <td className="py-1.5 px-3 text-center font-mono">5.00</td>
                      <td className="py-1.5 px-3 text-center font-mono">
                        {baseStudent.groupId ? "5.00" : "0.00"}
                      </td>
                      <td className="py-1.5 px-3 text-right">p*</td>
                    </tr>
                  </tbody>
                </table>

                {/* Dynamic Calculated Subtotal */}
                <div className="flex justify-between items-center border-t border-black bg-slate-100 px-3 py-1 text-xs font-semibold">
                  <span>Credit Attempted: {ay.creditAttempted.toFixed(2)}</span>
                  <span>Credit Completed: {ay.creditCompleted.toFixed(2)}</span>
                  <span className="font-bold text-[#0d6f66]">
                    Academic GPA: {ay.gpa.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}

            {/* COURSE TAGS LEGEND */}
            <div className="text-[10px] font-sans border-t border-b border-black py-1 px-2 mb-6 flex flex-wrap justify-between">
              <span>Course Tags:</span>
              <span>* = Non Academic</span>
              <span>+ = Honors (weighted)</span>
              <span>p = College Prep</span>
              <span>r = Repeated</span>
            </div>

            {/* LOWER 2-COLUMN PANELS */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">

              {/* Left Panel: Assessments & Verification */}
              <div className="border border-black p-2 space-y-3">
                <div>
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-black font-bold">
                        <th className="py-0.5">Date</th>
                        <th className="py-0.5">Test / Assessment</th>
                        <th className="py-0.5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-0.5">Comp</td>
                        <td className="py-0.5">Computer Science Fundamentals</td>
                        <td className="py-0.5 text-right font-semibold text-emerald-700">Passed</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Comp</td>
                        <td className="py-0.5">Mathematics & Probability</td>
                        <td className="py-0.5 text-right font-semibold text-emerald-700">Passed</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Comp</td>
                        <td className="py-0.5">Systems Architecture</td>
                        <td className="py-0.5 text-right font-semibold text-emerald-700">Passed</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Comp</td>
                        <td className="py-0.5">Group Allocation Selection</td>
                        <td className="py-0.5 text-right font-semibold text-emerald-700">
                          {baseStudent.groupId ? "Confirmed" : "Pending"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Roster Verification Record */}
                <div className="border-t border-black pt-2 text-[10px] space-y-0.5">
                  <p className="font-bold uppercase text-slate-700">Immunization & Verification Data</p>
                  <p>Records Presented: Official CADT Student Roster</p>
                  <p>CADT Email: {baseStudent.email}</p>
                  <p>Selection Timestamp: {baseStudent.selectedAt || "Not Selected Yet"}</p>
                  <p>Security Checksum: CADT-G12-PASSED-2026</p>
                </div>
              </div>

              {/* Right Panel: Dynamic Credit Summary Table */}
              <div className="border border-black p-2">
                <p className="font-bold text-[11px] uppercase mb-1 text-center border-b border-black pb-0.5">
                  Credit Summary
                </p>
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="py-0.5">Subject Area</th>
                      <th className="py-0.5 text-right">Credit Req&apos;d</th>
                      <th className="py-0.5 text-right">Compl</th>
                      <th className="py-0.5 text-right">Needed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {baseStudent.creditSummary.map((cs, idx) => (
                      <tr key={idx} className={cs.subjectArea.includes("TOTAL") ? "font-bold border-t border-black" : ""}>
                        <td className="py-0.5 font-sans">{cs.subjectArea}</td>
                        <td className="py-0.5 text-right">{cs.reqd.toFixed(2)}</td>
                        <td className="py-0.5 text-right">{cs.compl.toFixed(2)}</td>
                        <td className="py-0.5 text-right">{cs.needed.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] font-bold text-emerald-700 mt-2 text-center">
                  Major Group Requirement MET
                </p>
              </div>

            </div>

            {/* DYNAMIC CALCULATED GPA & RANKING SUMMARY BOX */}
            <div className="border border-black p-3 mb-8 text-xs font-sans bg-slate-50">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Calculated Academic GPA</p>
                  <div className="flex justify-center gap-4 font-mono font-bold text-[#0d6f66] mt-1">
                    <span>W: {baseStudent.weightedGpa.toFixed(4)}</span>
                    <span>NW: {baseStudent.unweightedGpa.toFixed(4)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Class Size / Rank</p>
                  <p className="font-semibold mt-1">
                    Rank <span className="font-bold text-black">{baseStudent.classRank}</span> of {baseStudent.classSize}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Attempted Credits</p>
                  <p className="font-mono font-bold mt-1">{baseStudent.totalAttemptedCredits.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-600">Completed Credits</p>
                  <p className="font-mono font-bold mt-1 text-emerald-700">
                    {baseStudent.totalCompletedCredits.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-center italic text-slate-600 mt-2">
                Dynamically calculated from subject score inputs • CADT Generation 12 Roster
              </p>
            </div>

            {/* OFFICIAL SIGNATURE FOOTER */}
            <div className="mt-12 pt-6 border-t border-black text-xs flex justify-between items-end">
              <div>
                <p className="italic text-slate-700">
                  This transcript is unofficial unless signed by a school official.
                </p>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <p className="font-serif italic border-b border-black pb-1 px-8">
                    Dr. Academic Registrar
                  </p>
                  <p className="text-[10px] uppercase mt-1 font-sans">Signature</p>
                </div>

                <div className="text-center">
                  <p className="font-mono border-b border-black pb-1 px-4">
                    {new Date().toLocaleDateString("en-US")}
                  </p>
                  <p className="text-[10px] uppercase mt-1 font-sans">Date</p>
                </div>
              </div>
            </div>

            </div>
          ) : (
            <div
              ref={printRef}
              id="report-document"
              className="w-full bg-white p-8 sm:p-12 text-black border border-slate-300 shadow-2xl rounded-sm print:shadow-none print:border-none print:p-0 print:m-0"
              style={{ maxWidth: "820px" }}
            >
              <EnglishContractDocument profile={contractProfile} />
              <div className="contract-page-break my-12 border-t-2 border-dashed border-slate-300 print:my-0 print:border-none" />
              <KhmerContractDocument profile={contractProfile} />
            </div>
          )}
        </main>
      </div>

      {/* Global Print Styling */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, button, nav, select, aside {
            display: none !important;
          }
          #report-document {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .contract-page-break {
            break-before: page;
            page-break-before: always;
          }
          .contract-signature-block,
          .contract-duty-table {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

function EnglishContractDocument({ profile }: { profile: ContractProfile }) {
  const lecturerName = orBlank(profile.lecturerNameEn);

  return (
    <article className="text-[15px] leading-relaxed text-black" style={{ fontFamily: EN_CONTRACT_FONT }}>
      <h1 className="mb-8 text-center text-xl font-bold uppercase">
        Employment Agreement
      </h1>

      <p>
        Employment Agreement, between Cambodia Academy of Digital Technology (The
        <strong> “CADT”</strong>) and <strong>{lecturerName}</strong> (The
        <strong> “Lecturer”</strong>). This agreement may be executed in hand or
        electronically. By signing or typing his/her name on the signature line,
        each of the parties indicates agreement. This contract is subject to the
        employee rules of The <strong>CADT</strong> attached hereto.
      </p>

      <p className="mt-5">The CADT employs the Lecturer on the following terms and conditions:</p>

      <ol className="mt-2 list-decimal space-y-2 pl-7">
        <li>
          <strong>Terms of Employment:</strong> Subject to the provisions for
          termination set forth below this agreement will begin on
          <strong> {formatDateEn(profile.startDate)}</strong> and the agreement is subject to a
          <strong> {profile.months}-month</strong> period.
        </li>
        <li>
          <strong>Salary:</strong> The <strong>CADT</strong> shall pay the Lecturer a
          salary of <strong>{formatKhr(profile.monthlySalary)} KHR</strong> per month
          for <strong>{profile.months} months</strong>, payable at regular payroll
          periods.
        </li>
        <li>
          <strong>Duties and Position:</strong> The <strong>CADT</strong> hires the
          Lecturer to teach the subject <strong>{orBlank(profile.subjectEn)}</strong> in
          <strong> Year {profile.year}, Term {profile.term}, Generation {profile.generation}, </strong>
          <strong>
            {orBlank(profile.departmentEn)}, Specialized in {orBlank(profile.specializationEn)}
          </strong>
          .
        </li>
      </ol>

      <p className="mt-3">The Lecturer accepts the following duties:</p>

      <table className="contract-duty-table my-5 w-full border-collapse text-[14px] leading-snug">
        <thead>
          <tr className="bg-[#9dc3e6] text-left">
            <th className="w-12 border border-black px-2 py-1 font-bold">No.</th>
            <th className="w-[32%] border border-black px-2 py-1 font-bold">Items</th>
            <th className="border border-black px-2 py-1 font-bold">Description</th>
          </tr>
        </thead>
        <tbody>
          {profile.duties.map((duty, index) => (
            <tr key={duty.id}>
              <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
              <td className="border border-black px-2 py-1">{duty.itemEn || BLANK}</td>
              <td className="border border-black px-2 py-1">{duty.descriptionEn}</td>
            </tr>
          ))}
          <tr className="bg-[#9dc3e6]">
            <td colSpan={3} className="border border-black px-2 py-2 text-right font-bold">
              TOTAL FEE: {formatKhr(getTotalFee(profile))} KHR
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3">
        The Lecturer&apos;s duties may be reasonably modified at the CADT&apos;s
        discretion from time to time.
      </p>

      <ol className="mt-5 list-decimal space-y-2 pl-7" start={4}>
        <li>
          <strong>Training Material:</strong> Any and all materials developed by the
          Lecturer in the course of work under this contract, such as video content,
          slides, class exercises, and case studies are the property of The CADT and
          may only be used for other purposes with permission of the CADT.
        </li>
        <li>
          <strong>Confidentiality of Proprietary Information:</strong> Lecturer
          agrees, during or after the term of this employment, not to reveal
          non-public information such as school business strategy, lessons, lesson
          plans, student names, client names, contacts, marketing activities, or
          financial data including to any person or entity directly or indirectly.
        </li>
        <li>
          <strong>Termination of Agreement:</strong> The CADT may terminate this
          agreement at any time and will pay the Lecturer his/her regular salary up
          to the date of termination; if there is no regular salary then such
          compensation will be a reasonable amount for the work completed to date.
        </li>
        <li>
          <strong>Severability:</strong> If for any reason, any provision of this
          agreement is held invalid, all other provisions of this agreement shall
          remain in effect.
        </li>
        <li>
          <strong>Governing Law and Dispute Resolution:</strong> This Agreement shall
          be governed by and construed according to the laws of Cambodia. Any dispute
          arising out of this Agreement shall be settled by Cambodia authorities
          and/or courts if no amicable settlement can be reached. In the event that
          any matter arises which is not covered by this Agreement, the Parties shall
          follow the laws and best practices in Cambodia to deal with such matters.
        </li>
      </ol>

      <p className="mt-8 font-bold uppercase">In Witness Whereof,</p>
      <p>
        the Parties have hereupon executed this Agreement on the date first written
        above, in two (2) original copies in the English language and two (2)
        original copies in the Khmer language, one of which shall be kept by each
        Party.
      </p>

      <div className="contract-signature-block mt-16 grid grid-cols-2 gap-12 text-center text-[14px]">
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p className="font-bold">On behalf of CADT</p>
          <p>Date: ............................</p>
        </div>
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p className="font-bold">{lecturerName}</p>
          <p>Date: ............................</p>
        </div>
      </div>
    </article>
  );
}

function KhmerContractDocument({ profile }: { profile: ContractProfile }) {
  // Khmer fields fall back to the English value when left empty
  const lecturerName = orBlank(profile.lecturerNameKh || profile.lecturerNameEn);
  const subject = orBlank(profile.subjectKh || profile.subjectEn);
  const department = orBlank(profile.departmentKh || profile.departmentEn);
  const specialization = orBlank(profile.specializationKh || profile.specializationEn);

  return (
    <article className="text-[14px] leading-[1.9] text-black" style={{ fontFamily: KH_CONTRACT_FONT }}>
      <h1 className="mb-7 text-center text-[22px] font-bold">
        កិច្ចសន្យាការងារ
      </h1>

      <p>
        កិច្ចសន្យាការងាររវាងបណ្ឌិត្យសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា (CADT) និង
        <strong> {lecturerName}</strong> (សាស្ត្រាចារ្យ)។ កិច្ចសន្យានេះ
        អាចអនុវត្តន៍បានតាមរយៈដោយផ្ទាល់ ឬតាមប្រព័ន្ធអេឡិចត្រូនិក។
        ការចុះហត្ថលេខា ឬសរសេរឈ្មោះសាស្ត្រាចារ្យត្រង់កន្លែងចុះហត្ថលេខា
        បង្ហាញថាភាគីនីមួយៗយល់ព្រមតាមកិច្ចសន្យានេះ។
      </p>

      <p className="mt-4">CADT បានជួលសាស្ត្រាចារ្យទៅតាមខចែង និងលក្ខខណ្ឌខាងក្រោមនេះ៖</p>

      <div className="mt-2 space-y-2">
        <p>
          <strong>១. ខចែងនៃការងារ៖</strong> កិច្ចសន្យានេះនឹងចាប់ផ្តើមពី
          <strong> {formatDateKh(profile.startDate)}</strong> ដែលមានរយៈពេល
          <strong> {toKhmerNumerals(profile.months)}ខែ</strong>។
        </p>
        <p>
          <strong>២. ប្រាក់បៀវត្សរ៍៖</strong> CADT នឹងបើកជូននូវប្រាក់បៀវត្សរ៍
          សាស្ត្រាចារ្យចំនួន <strong>{toKhmerNumerals(formatKhr(profile.monthlySalary))} រៀល</strong>
          ក្នុង១ខែ សម្រាប់រយៈពេល <strong>{toKhmerNumerals(profile.months)}ខែ</strong>
          ដោយបើកជូនទៀងទាត់ក្នុងកំឡុងពេលទូទាត់ប្រាក់បៀវត្សរ៍ប្រចាំខែ។
        </p>
        <p>
          <strong>៣. ភារកិច្ច និងតួនាទី៖</strong> CADT ជួលសាស្ត្រាចារ្យដើម្បីបង្រៀនមុខវិជ្ជា
          <strong> {subject}</strong> ឆ្នាំទី{toKhmerNumerals(profile.year)}{" "}
          វគ្គសិក្សាទី{toKhmerNumerals(profile.term)} ជំនាន់ទី{toKhmerNumerals(profile.generation)}{" "}
          នៃ{department} ឯកទេស<strong> {specialization}</strong>។
        </p>
      </div>

      <p className="mt-3">សាស្ត្រាចារ្យត្រូវទទួលនូវភារកិច្ចដូចខាងក្រោមនេះ៖</p>

      <table className="contract-duty-table my-5 w-full border-collapse text-[13px] leading-[1.6]">
        <thead>
          <tr className="bg-[#9dc3e6] text-left">
            <th className="w-12 border border-black px-2 py-1 font-bold">ល.រ</th>
            <th className="w-[32%] border border-black px-2 py-1 font-bold">បរិយាយ</th>
            <th className="border border-black px-2 py-1 font-bold">ព័ត៌មានលំអិត</th>
          </tr>
        </thead>
        <tbody>
          {profile.duties.map((duty, index) => (
            <tr key={duty.id}>
              <td className="border border-black px-2 py-1 text-center">
                {toKhmerNumerals(index + 1)}
              </td>
              <td className="border border-black px-2 py-1">{duty.itemKh || duty.itemEn || BLANK}</td>
              <td className="border border-black px-2 py-1">{duty.descriptionKh || duty.descriptionEn}</td>
            </tr>
          ))}
          <tr className="bg-[#9dc3e6]">
            <td colSpan={3} className="border border-black px-2 py-2 text-right font-bold">
              ប្រាក់បៀវត្សរ៍សរុប៖ {toKhmerNumerals(formatKhr(getTotalFee(profile)))} រៀល
            </td>
          </tr>
        </tbody>
      </table>

      <p>ភារកិច្ចរបស់សាស្ត្រាចារ្យអាចនឹងកែប្រែដោយសមហេតុផលតាមការសម្រេចចិត្តរបស់ CADT។</p>

      <div className="mt-4 space-y-2">
        <p>
          <strong>៤. សម្ភារៈបណ្តុះបណ្តាល៖</strong> រាល់សម្ភារៈដែលរៀបចំដោយសាស្ត្រាចារ្យ
          ក្នុងមុខវិជ្ជាបង្រៀន ដូចជា វីដេអូមេរៀន ស្លាយ លំហាត់ និងករណីសិក្សា
          គឺជាទ្រព្យសម្បត្តិរបស់ CADT។
        </p>
        <p>
          <strong>៥. ការសម្ងាត់នៃកម្មសិទ្ធិព័ត៌មាន៖</strong> សាស្ត្រាចារ្យយល់ព្រមថា
          ក្នុងកំឡុងពេល និងក្រោយបញ្ចប់ការងារ មិនត្រូវលាតត្រដាងព័ត៌មានមិនមែនសាធារណៈ
          រួមមានយុទ្ធសាស្ត្រសាលា មេរៀន គម្រោងមេរៀន ឈ្មោះនិស្សិត ឈ្មោះអតិថិជន
          ព័ត៌មានទំនាក់ទំនង សកម្មភាពទីផ្សារ ឬទិន្នន័យហិរញ្ញវត្ថុ។
        </p>
        <p>
          <strong>៦. ការបញ្ចប់នៃកិច្ចសន្យា៖</strong> CADT អាចបញ្ចប់កិច្ចសន្យានេះបានគ្រប់ពេល
          ហើយនឹងបើកប្រាក់បៀវត្សរ៍ជូនសាស្ត្រាចារ្យរហូតដល់ថ្ងៃបញ្ឈប់កិច្ចសន្យា។
        </p>
        <p>
          <strong>៧. ទុព្វលភាព៖</strong> ប្រសិនបើមានខចែងណាមួយមិនត្រឹមត្រូវ
          ខចែងដទៃទៀតក្នុងកិច្ចសន្យានេះនៅតែមានប្រសិទ្ធភាព។
        </p>
        <p>
          <strong>៨. ច្បាប់គ្រប់គ្រង និងដំណោះស្រាយជម្លោះ៖</strong> កិច្ចសន្យានេះត្រូវគ្រប់គ្រង
          និងបកស្រាយតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ រាល់ជម្លោះនឹងត្រូវដោះស្រាយដោយអាជ្ញាធរ
          ឬតុលាការកម្ពុជាក្នុងករណីមិនអាចសម្របសម្រួលដោយសន្តិវិធីបាន។
        </p>
      </div>

      <p className="mt-8">
        ដើម្បីជាភស្តុតាង ភាគីទាំងពីរចាប់ផ្តើមប្រតិបត្តិនូវកិច្ចសន្យានេះចាប់ពីថ្ងៃដែលបានចុះខាងលើ
        ហើយកិច្ចសន្យានេះធ្វើចំនួន០២ច្បាប់ដើមជាភាសាអង់គ្លេស និង០២ច្បាប់ដើមជាភាសាខ្មែរ
        ដោយភាគីនីមួយៗរក្សាទុក០១ច្បាប់រៀងៗខ្លួន។
      </p>

      <div className="contract-signature-block mt-16 grid grid-cols-2 gap-12 text-center text-[13px]">
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p className="font-bold">ភាគីតំណាងបណ្ឌិត្យសភា</p>
          <p>ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........</p>
        </div>
        <div>
          <div className="mb-2 border-b border-black pb-8" />
          <p className="font-bold">{lecturerName}</p>
          <p>ថ្ងៃទី ........ ខែ ........ ឆ្នាំ ........</p>
        </div>
      </div>
    </article>
  );
}
