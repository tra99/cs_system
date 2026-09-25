import Image from "next/image";
import Link from "next/link";
import { Users, FileText, ArrowRight, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OptionPage() {
  return (
    <main className="relative min-h-screen bg-[#edf7f3] font-sans text-[#102622] flex flex-col justify-between">
      {/* Background Graphic */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/campus-email-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,34,31,0.95),rgba(8,63,58,0.85)_50%,rgba(237,247,243,0.6))]" />
      </div>

      {/* Header Bar */}
      <header className="border-b border-white/20 bg-black/10 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#0d6f66] text-white shadow-lg shadow-[#0d6f66]/20">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0c66d]">
                CADT
              </p>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Computer Science Portal
              </h1>
            </div>
          </div>
          <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Generation 12
          </span>
        </div>
      </header>

      {/* Main Options Section */}
      <section className="mx-auto my-auto w-full max-w-5xl px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 text-white">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Select System Action
          </h2>
          <p className="mt-3 text-base text-white/80">
            Please choose an option below to proceed to Student Access or Generate Academic Transcript Reports.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">

          {/* Option 1: Student Group Selection */}
          <article className="group flex flex-col justify-between rounded-2xl border border-white/40 bg-white/92 p-8 shadow-[0_20px_60px_rgba(5,34,31,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#0d6f66] text-white shadow-lg shadow-[#0d6f66]/30">
                <Users className="size-7" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0d6f66]">
                Option 1
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#102622]">
                Student Group Selection
              </h3>
              <p className="mt-3 text-sm text-[#4b635e] leading-relaxed">
                Log in with your official CADT email (<code className="font-semibold text-[#0d6f66]">@student.cadt.edu.kh</code>) to choose your designated track group (Data Science or Software Engineering).
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#d8e5e1]">
              <Link
                href="/login"
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#102622] px-5 text-sm font-semibold text-white shadow-lg shadow-[#102622]/20 transition-all hover:bg-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/20"
              >
                <span>Continue to Login Form</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>

          {/* Option 2: Generate Report (Transcript) */}
          <article className="group flex flex-col justify-between rounded-2xl border border-white/40 bg-white/92 p-8 shadow-[0_20px_60px_rgba(5,34,31,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div>
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-[#1f5f9f] text-white shadow-lg shadow-[#1f5f9f]/30">
                <FileText className="size-7" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1f5f9f]">
                Option 2
              </p>
              <h3 className="mt-1 text-2xl font-bold text-[#102622]">
                Generate Report & Transcript
              </h3>
              <p className="mt-3 text-sm text-[#4b635e] leading-relaxed">
                Generate official academic transcript reports configured with course history, GPA summaries, group allocations, and export high-resolution documents or PDF.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#d8e5e1]">
              <Link
                href="/report"
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1f5f9f] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1f5f9f]/20 transition-all hover:bg-[#17487a] focus:outline-none focus:ring-4 focus:ring-[#1f5f9f]/20"
              >
                <span>Generate Transcript Report</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-white/70 border-t border-white/10 bg-black/10">
        <p>© {new Date().getFullYear()} CADT Institute of Digital Technology. All rights reserved.</p>
      </footer>
    </main>
  );
}
