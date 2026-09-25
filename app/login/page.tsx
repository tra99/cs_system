import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentEmailFromCookie } from "../actions";
import { LoginForm } from "../LoginForm";
import { ArrowLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

type LoginSearchParams = Promise<{
  error?: string | string[];
}>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const existingEmail = await getStudentEmailFromCookie();

  if (existingEmail) {
    redirect("/home");
  }

  const error = readParam((await searchParams).error);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#edf7f3] px-5 py-10 font-sans text-[#102622] sm:px-8">
      <Image
        src="/campus-email-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(5,34,31,0.92),rgba(8,63,58,0.72)_47%,rgba(255,255,255,0.25))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-[linear-gradient(0deg,rgba(237,247,243,0.92),rgba(237,247,243,0))]" />

      <div className="w-full max-w-[460px]">
        {/* Top return link */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/30 hover:border-white/50"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Option Page</span>
          </Link>
        </div>

        <section className="rounded-2xl border border-white/40 bg-white/92 p-6 shadow-[0_24px_70px_rgba(5,34,31,0.32)] backdrop-blur-md sm:p-8">
          <div className="mb-8 flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#0d6f66] text-white shadow-lg shadow-[#0d6f66]/25">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0d6f66]">
                CADT Student Portal
              </p>
              <h1 className="text-2xl font-bold text-[#102622]">
                Student Access Login
              </h1>
            </div>
          </div>

          <LoginForm error={error} />
        </section>
      </div>
    </main>
  );
}
