"use client";

import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ContractDuty,
  ContractProfile,
  KH_CONTRACT_FONT,
  SPECIALIZATION_PRESETS,
  formatDateEn,
  formatDateKh,
  formatKhr,
  getMissingFields,
  getTotalFee,
} from "./contract";

type ContractEditorProps = {
  profile: ContractProfile;
  onChange: (profile: ContractProfile) => void;
  onReset: () => void;
};

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-[#0d6f66] focus:ring-2 focus:ring-[#0d6f66]/15";

export function inputClass(isMissing = false) {
  return isMissing ? `${INPUT_CLASS} border-amber-400 bg-amber-50` : INPUT_CLASS;
}

export function toNumber(raw: string, min: number) {
  const parsed = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.floor(parsed));
}

export function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function LangTag({ lang }: { lang: "EN" | "KH" }) {
  return (
    <span
      className={`inline-flex w-7 shrink-0 justify-center rounded px-1 py-1.5 text-[10px] font-bold ${
        lang === "EN" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {lang}
    </span>
  );
}

// One English input and one Khmer input for the same field
export function BilingualField({
  label,
  en,
  kh,
  onEnChange,
  onKhChange,
  enPlaceholder,
  khPlaceholder,
  required = false,
}: {
  label: string;
  en: string;
  kh: string;
  onEnChange: (value: string) => void;
  onKhChange: (value: string) => void;
  enPlaceholder?: string;
  khPlaceholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-semibold text-slate-600">
        {label}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      <div className="flex items-center gap-1.5">
        <LangTag lang="EN" />
        <input
          value={en}
          onChange={(e) => onEnChange(e.target.value)}
          placeholder={enPlaceholder}
          className={inputClass(required && !en.trim())}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <LangTag lang="KH" />
        <input
          value={kh}
          onChange={(e) => onKhChange(e.target.value)}
          placeholder={khPlaceholder ?? "Leave empty to reuse English"}
          className={inputClass()}
          style={{ fontFamily: KH_CONTRACT_FONT }}
        />
      </div>
    </div>
  );
}

export function ContractEditor({ profile, onChange, onReset }: ContractEditorProps) {
  const missing = getMissingFields(profile);

  const update = <K extends keyof ContractProfile>(key: K, value: ContractProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const updateDuty = (id: string, field: keyof Omit<ContractDuty, "id">, value: string) => {
    update(
      "duties",
      profile.duties.map((duty) => (duty.id === id ? { ...duty, [field]: value } : duty))
    );
  };

  const moveDuty = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= profile.duties.length) return;
    const duties = [...profile.duties];
    [duties[index], duties[target]] = [duties[target], duties[index]];
    update("duties", duties);
  };

  const addDuty = () => {
    update("duties", [
      ...profile.duties,
      { id: `duty-${Date.now()}`, itemEn: "", descriptionEn: "", itemKh: "", descriptionKh: "" },
    ]);
  };

  const removeDuty = (id: string) => {
    update(
      "duties",
      profile.duties.filter((duty) => duty.id !== id)
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Contract Details</h2>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear all contract details and restore defaults?")) onReset();
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

      <Section icon={<UserRound className="size-4 text-[#0d6f66]" />} title="Lecturer">
        <BilingualField
          label="Full name"
          required
          en={profile.lecturerNameEn}
          kh={profile.lecturerNameKh}
          onEnChange={(value) => update("lecturerNameEn", value)}
          onKhChange={(value) => update("lecturerNameKh", value)}
          enPlaceholder="e.g. Sok Dara"
          khPlaceholder="e.g. សុខ ដារា"
        />
      </Section>

      <Section icon={<CalendarDays className="size-4 text-[#0d6f66]" />} title="Employment Terms">
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

        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-3">
            <Field label="Monthly salary (KHR) *">
              <input
                inputMode="numeric"
                value={profile.monthlySalary ? formatKhr(profile.monthlySalary) : ""}
                onChange={(e) => update("monthlySalary", toNumber(e.target.value, 0))}
                placeholder="2,152,500"
                className={`${inputClass(profile.monthlySalary <= 0)} font-mono`}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Duration (months)">
              <input
                type="number"
                min={1}
                max={60}
                value={profile.months}
                onChange={(e) => update("months", Math.min(60, toNumber(e.target.value, 1)))}
                className={`${inputClass()} font-mono`}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]">
          <span className="text-slate-500">Total fee (auto)</span>
          <span className="font-mono font-bold text-slate-900">{formatKhr(getTotalFee(profile))} KHR</span>
        </div>
      </Section>

      <Section icon={<BookOpen className="size-4 text-[#0d6f66]" />} title="Teaching Assignment">
        <BilingualField
          label="Subject"
          required
          en={profile.subjectEn}
          kh={profile.subjectKh}
          onEnChange={(value) => update("subjectEn", value)}
          onKhChange={(value) => update("subjectKh", value)}
          enPlaceholder="e.g. Cloud Computing"
        />

        <div className="grid grid-cols-3 gap-2">
          <Field label="Year">
            <select
              value={profile.year}
              onChange={(e) => update("year", Number(e.target.value))}
              className={inputClass()}
            >
              {[1, 2, 3, 4, 5].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Term">
            <select
              value={profile.term}
              onChange={(e) => update("term", Number(e.target.value))}
              className={inputClass()}
            >
              {[1, 2, 3].map((term) => (
                <option key={term} value={term}>
                  Term {term}
                </option>
              ))}
            </select>
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

        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {SPECIALIZATION_PRESETS.map((preset) => {
              const isActive = profile.specializationEn === preset.en;
              return (
                <button
                  key={preset.en}
                  type="button"
                  onClick={() =>
                    onChange({ ...profile, specializationEn: preset.en, specializationKh: preset.kh })
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
            label="Specialization"
            required
            en={profile.specializationEn}
            kh={profile.specializationKh}
            onEnChange={(value) => update("specializationEn", value)}
            onKhChange={(value) => update("specializationKh", value)}
          />
        </div>
      </Section>

      <Section
        icon={<ClipboardList className="size-4 text-[#0d6f66]" />}
        title={`Duties (${profile.duties.length})`}
      >
        <div className="space-y-2">
          {profile.duties.map((duty, index) => (
            <div key={duty.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">No. {index + 1}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveDuty(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDuty(index, 1)}
                    disabled={index === profile.duties.length - 1}
                    className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDuty(duty.id)}
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
                  value={duty.itemEn}
                  onChange={(e) => updateDuty(duty.id, "itemEn", e.target.value)}
                  placeholder="Item"
                  className={`${inputClass(!duty.itemEn.trim())} font-semibold`}
                />
              </div>
              <textarea
                value={duty.descriptionEn}
                onChange={(e) => updateDuty(duty.id, "descriptionEn", e.target.value)}
                placeholder="Description"
                rows={2}
                className={`${inputClass()} resize-y`}
              />
              <div className="flex items-center gap-1.5">
                <LangTag lang="KH" />
                <input
                  value={duty.itemKh}
                  onChange={(e) => updateDuty(duty.id, "itemKh", e.target.value)}
                  placeholder="បរិយាយ (leave empty to reuse English)"
                  className={`${inputClass()} font-semibold`}
                  style={{ fontFamily: KH_CONTRACT_FONT }}
                />
              </div>
              <textarea
                value={duty.descriptionKh}
                onChange={(e) => updateDuty(duty.id, "descriptionKh", e.target.value)}
                placeholder="ព័ត៌មានលំអិត"
                rows={2}
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
