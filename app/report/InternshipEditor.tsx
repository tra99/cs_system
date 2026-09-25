"use client";

import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { KH_CONTRACT_FONT, formatDateEn, formatDateKh, formatKhr } from "./contract";
import { BilingualField, Field, LangTag, Section, inputClass, toNumber } from "./ContractEditor";
import {
  DEFAULT_EXCHANGE_RATE,
  INTERNSHIP_PRESETS,
  InternshipDuty,
  InternshipProfile,
  InternshipStudent,
  getHourlyRateKhr,
  getHoursPerStudent,
  getInternshipMissingFields,
  getInternshipTotal,
  getInternshipTotalUsd,
  getTotalHours,
} from "./internship";

// Accepts decimals like 12.5; empty or invalid input becomes 0
function toDecimal(raw: string) {
  const parsed = Number(raw.replace(/[,$\s]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

type InternshipEditorProps = {
  profile: InternshipProfile;
  onChange: (profile: InternshipProfile) => void;
  onReset: () => void;
};

export function InternshipEditor({ profile, onChange, onReset }: InternshipEditorProps) {
  const missing = getInternshipMissingFields(profile);
  const hoursPerStudent = getHoursPerStudent(profile);
  const totalHours = getTotalHours(profile);

  const update = <K extends keyof InternshipProfile>(key: K, value: InternshipProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const updateStudent = (id: string, field: keyof Omit<InternshipStudent, "id">, value: string) => {
    update(
      "students",
      profile.students.map((student) => (student.id === id ? { ...student, [field]: value } : student))
    );
  };

  const addStudent = () => {
    update("students", [
      ...profile.students,
      { id: `student-${Date.now()}`, nameEn: "", nameKh: "", project: "", company: "" },
    ]);
  };

  const updateDuty = <K extends keyof Omit<InternshipDuty, "id">>(id: string, field: K, value: InternshipDuty[K]) => {
    update(
      "duties",
      profile.duties.map((duty) => (duty.id === id ? { ...duty, [field]: value } : duty))
    );
  };

  const addDuty = () => {
    update("duties", [
      ...profile.duties,
      { id: `duty-${Date.now()}`, titleEn: "", titleKh: "", bulletsEn: "", bulletsKh: "", hoursPerStudent: 1 },
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Internship Advisor Contract</h2>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all internship contract details and restore defaults?")) onReset();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Changes update both the English and Khmer contract in the preview. Your draft is saved in
          this browser.
        </p>
        {missing.length > 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
            Still missing: {missing.join(", ")}
          </p>
        ) : (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-800">
            All required fields are filled. Ready to print.
          </p>
        )}
      </div>

      <Section icon={<UserRound className="size-4 text-[#0d6f66]" />} title="Advisor">
        <BilingualField
          label="Full name"
          required
          en={profile.advisorNameEn}
          kh={profile.advisorNameKh}
          onEnChange={(value) => update("advisorNameEn", value)}
          onKhChange={(value) => update("advisorNameKh", value)}
          enPlaceholder="e.g. Sok Dara"
          khPlaceholder="e.g. សុខ ដារា"
        />
      </Section>

      <Section icon={<CalendarDays className="size-4 text-[#0d6f66]" />} title="Terms & Payment">
        <Field
          label="Start date *"
          hint={profile.startDate ? `${formatDateEn(profile.startDate)} • ${formatDateKh(profile.startDate)}` : undefined}
        >
          <input
            type="date"
            value={profile.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputClass(!profile.startDate)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Rate per hour (USD) *">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={profile.hourlyRateUsd || ""}
                onChange={(e) => update("hourlyRateUsd", toDecimal(e.target.value))}
                placeholder="28"
                className={`${inputClass(profile.hourlyRateUsd <= 0)} pl-5 font-mono`}
              />
            </div>
          </Field>
          <Field label="Exchange rate (KHR / USD)">
            <input
              type="number"
              min={1}
              value={profile.exchangeRate || ""}
              onChange={(e) => update("exchangeRate", toNumber(e.target.value, 0))}
              placeholder={String(DEFAULT_EXCHANGE_RATE)}
              className={`${inputClass(profile.exchangeRate <= 0)} font-mono`}
            />
          </Field>
        </div>

        <p className="text-[10px] text-slate-400">
          Hours come from each duty below ({hoursPerStudent}h per student × {profile.students.length}{" "}
          students = {totalHours}h).
        </p>

        <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-mono">
          <div className="flex justify-between text-slate-500">
            <span>Rate in riel</span>
            <span>
              {formatUsd(profile.hourlyRateUsd)} × {formatKhr(profile.exchangeRate)} ={" "}
              {formatKhr(getHourlyRateKhr(profile))} KHR/h
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Total in USD</span>
            <span>
              {totalHours}h × {formatUsd(profile.hourlyRateUsd)} = {formatUsd(getInternshipTotalUsd(profile))}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
            <span className="font-sans">Total payment</span>
            <span>{formatKhr(getInternshipTotal(profile))} KHR</span>
          </div>
        </div>
      </Section>

      <Section icon={<BookOpen className="size-4 text-[#0d6f66]" />} title="Program">
        <div className="flex flex-wrap gap-1.5">
          {INTERNSHIP_PRESETS.map((preset) => {
            const isActive = profile.internshipEn === preset.en;
            return (
              <button
                key={preset.en}
                type="button"
                onClick={() =>
                  onChange({ ...profile, internshipEn: preset.en, internshipKh: preset.kh, term: preset.term })
                }
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-[#0d6f66] bg-[#0d6f66] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {preset.en}
              </button>
            );
          })}
        </div>
        <BilingualField
          label="Internship"
          en={profile.internshipEn}
          kh={profile.internshipKh}
          onEnChange={(value) => update("internshipEn", value)}
          onKhChange={(value) => update("internshipKh", value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <Field label="Term">
            <input
              type="number"
              min={1}
              value={profile.term}
              onChange={(e) => update("term", toNumber(e.target.value, 1))}
              className={`${inputClass()} font-mono`}
            />
          </Field>
          <Field label="Generation">
            <input
              type="number"
              min={1}
              value={profile.generation}
              onChange={(e) => update("generation", toNumber(e.target.value, 1))}
              className={`${inputClass()} font-mono`}
            />
          </Field>
        </div>

        <BilingualField
          label="Department"
          en={profile.departmentEn}
          kh={profile.departmentKh}
          onEnChange={(value) => update("departmentEn", value)}
          onKhChange={(value) => update("departmentKh", value)}
        />
      </Section>

      <Section
        icon={<GraduationCap className="size-4 text-[#0d6f66]" />}
        title={`Students (${profile.students.length})`}
      >
        <div className="space-y-2">
          {profile.students.map((student, index) => (
            <div key={student.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">No. {index + 1}</span>
                <button
                  type="button"
                  onClick={() => update("students", profile.students.filter((s) => s.id !== student.id))}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Remove student"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <LangTag lang="EN" />
                <input
                  value={student.nameEn}
                  onChange={(e) => updateStudent(student.id, "nameEn", e.target.value)}
                  placeholder="Student name"
                  className={inputClass(!student.nameEn.trim())}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <LangTag lang="KH" />
                <input
                  value={student.nameKh}
                  onChange={(e) => updateStudent(student.id, "nameKh", e.target.value)}
                  placeholder="ឈ្មោះនិស្សិត (leave empty to reuse English)"
                  className={inputClass()}
                  style={{ fontFamily: KH_CONTRACT_FONT }}
                />
              </div>
              <input
                value={student.project}
                onChange={(e) => updateStudent(student.id, "project", e.target.value)}
                placeholder="Project / Topic"
                className={inputClass()}
              />
              <input
                value={student.company}
                onChange={(e) => updateStudent(student.id, "company", e.target.value)}
                placeholder="Company name"
                className={inputClass()}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addStudent}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#0d6f66]/50 py-2 text-xs font-semibold text-[#0d6f66] hover:bg-[#0d6f66]/5 transition"
        >
          <Plus className="size-4" />
          Add student
        </button>
      </Section>

      <Section
        icon={<ClipboardList className="size-4 text-[#0d6f66]" />}
        title={`Duties (${profile.duties.length})`}
      >
        <div className="space-y-2">
          {profile.duties.map((duty, index) => (
            <div key={duty.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700">No. {index + 1}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Hours / student</span>
                  <input
                    type="number"
                    min={0}
                    value={duty.hoursPerStudent}
                    onChange={(e) => updateDuty(duty.id, "hoursPerStudent", toNumber(e.target.value, 0))}
                    className={`${inputClass()} w-16 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => update("duties", profile.duties.filter((d) => d.id !== duty.id))}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Remove duty"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <LangTag lang="EN" />
                <input
                  value={duty.titleEn}
                  onChange={(e) => updateDuty(duty.id, "titleEn", e.target.value)}
                  placeholder="Main task"
                  className={`${inputClass(!duty.titleEn.trim())} font-semibold`}
                />
              </div>
              <textarea
                value={duty.bulletsEn}
                onChange={(e) => updateDuty(duty.id, "bulletsEn", e.target.value)}
                placeholder="Bullet points, one per line (optional)"
                rows={3}
                className={`${inputClass()} resize-y`}
              />
              <div className="flex items-center gap-1.5">
                <LangTag lang="KH" />
                <input
                  value={duty.titleKh}
                  onChange={(e) => updateDuty(duty.id, "titleKh", e.target.value)}
                  placeholder="ការងារគោល (leave empty to reuse English)"
                  className={`${inputClass()} font-semibold`}
                  style={{ fontFamily: KH_CONTRACT_FONT }}
                />
              </div>
              <textarea
                value={duty.bulletsKh}
                onChange={(e) => updateDuty(duty.id, "bulletsKh", e.target.value)}
                placeholder="ចំណុចលម្អិត មួយបន្ទាត់មួយចំណុច"
                rows={3}
                className={`${inputClass()} resize-y`}
                style={{ fontFamily: KH_CONTRACT_FONT }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addDuty}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#0d6f66]/50 py-2 text-xs font-semibold text-[#0d6f66] hover:bg-[#0d6f66]/5 transition"
        >
          <Plus className="size-4" />
          Add duty
        </button>
      </Section>
    </div>
  );
}
