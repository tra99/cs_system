import Image from "next/image";
import { redirect } from "next/navigation";
import { getStudentEmailFromCookie } from "./actions";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

type LoginSearchParams = Promise<{
  error?: string | string[];
}>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
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
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(5,34,31,0.88),rgba(8,63,58,0.62)_47%,rgba(255,255,255,0.2))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-[linear-gradient(0deg,rgba(237,247,243,0.92),rgba(237,247,243,0))]" />

      <section className="w-full max-w-[460px] rounded-lg border border-white/40 bg-white/90 p-6 shadow-[0_24px_70px_rgba(5,34,31,0.28)] backdrop-blur-md sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-[#0d6f66] text-base font-bold text-white shadow-lg shadow-[#0d6f66]/20">
            C
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0d6f66]">
              CADT
            </p>
            <h1 className="text-2xl font-semibold text-[#102622]">
              Student Access
            </h1>
          </div>
        </div>

        <LoginForm error={error} />
      </section>
    </main>
  );
}
