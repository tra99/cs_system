import Image from "next/image";
import { redirect } from "next/navigation";
import {
  chooseGroupAction,
  clearStudentEmailAction,
  getStudentEmailFromCookie,
} from "../actions";
import { getGroupSelectionData } from "../lib/students";

export const dynamic = "force-dynamic";

type HomeSearchParams = Promise<{
  error?: string | string[];
  selected?: string | string[];
}>;

const messages: Record<string, string> = {
  full: "That group is already full. Please choose another available group.",
  "invalid-email": "Please enter your CADT email again before choosing a group.",
  "invalid-group": "That group choice is not available.",
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const email = await getStudentEmailFromCookie();

  if (!email) {
    redirect("/");
  }

  const params = await searchParams;
  const error = readParam(params.error);
  const selected = readParam(params.selected);
  const { groups, student } = await getGroupSelectionData(email);
  const groupedTracks = ["Data Science", "Software Engineering"].map(
    (track) => ({
      track,
      groups: groups.filter((group) => group.track === track),
    }),
  );

  return (
    <main className="min-h-screen bg-[#eef6f3] font-sans text-[#102622]">
      <section className="relative isolate overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
        <Image
          src="/campus-email-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(4,31,29,0.92),rgba(9,80,72,0.78)_48%,rgba(238,246,243,0.74))]" />

        <div className="mx-auto flex min-h-[310px] w-full max-w-6xl flex-col justify-end gap-7 pb-4 pt-16">
          <div className="max-w-3xl text-white">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f0c66d]">
              Computer Science
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Welcome to Computer Science
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/82">
              Choose your group.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-lg border border-white/20 bg-white/12 p-4 text-sm text-white shadow-[0_20px_60px_rgba(4,31,29,0.24)] backdrop-blur-md sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">{email}</p>
              <p className="text-white/72">
                {student?.groupId
                  ? `${student.track} - ${student.groupName}`
                  : "No group selected yet"}
              </p>
            </div>
            <form action={clearStudentEmailAction}>
              <button
                type="submit"
                className="h-10 rounded-lg border border-white/30 px-4 font-semibold text-white transition hover:bg-white/12 focus:outline-none focus:ring-4 focus:ring-white/20"
              >
                Change email
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          {error ? (
            <div className="mb-5 rounded-lg border border-[#efb6b6] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#b42318]">
              {messages[error] ?? "Something went wrong. Please try again."}
            </div>
          ) : null}

          {selected ? (
            <div className="mb-5 rounded-lg border border-[#b7decf] bg-[#eefbf6] px-4 py-3 text-sm font-semibold text-[#0d6f66]">
              Your group choice has been saved.
            </div>
          ) : null}

          <div className="space-y-8">
            {groupedTracks.map(({ track, groups: trackGroups }) => (
              <section key={track}>
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0d6f66]">
                      Major
                    </p>
                    <h2 className="text-2xl font-semibold text-[#102622]">
                      {track}
                    </h2>
                  </div>
                  <p className="text-sm font-medium text-[#5e736f]">
                    32 seats per group
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {trackGroups.map((group) => {
                    const soldOut = group.remaining <= 0;
                    const fillPercent = Math.min(
                      100,
                      Math.round((group.taken / group.capacity) * 100),
                    );

                    return (
                      <article
                        key={group.id}
                        className="rounded-lg border border-[#d7e4df] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#102622]/8"
                      >
                        <div className="mb-5 flex items-center justify-between gap-4">
                          <div
                            className="flex size-12 items-center justify-center rounded-lg text-sm font-bold"
                            style={{
                              backgroundColor: group.softAccent,
                              color: group.accent,
                            }}
                          >
                            {group.id.toUpperCase().replace("-", "")}
                          </div>
                          <span
                            className="rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
                            style={{
                              backgroundColor: soldOut
                                ? "#fff0f0"
                                : group.softAccent,
                              color: soldOut ? "#b42318" : group.accent,
                            }}
                          >
                            {soldOut ? "Full" : "In stock"}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold text-[#102622]">
                          {group.groupName}
                        </h3>
                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-4xl font-semibold text-[#102622]">
                              {group.remaining}
                            </p>
                            <p className="text-sm font-medium text-[#607570]">
                              seats remaining
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[#607570]">
                            {group.taken}/{group.capacity}
                          </p>
                        </div>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7efec]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${fillPercent}%`,
                              backgroundColor: group.accent,
                            }}
                          />
                        </div>

                        <form action={chooseGroupAction} className="mt-5">
                          <input
                            type="hidden"
                            name="groupId"
                            value={group.id}
                          />
                          <button
                            type="submit"
                            disabled={soldOut}
                            className="h-11 w-full rounded-lg bg-[#102622] px-4 text-sm font-semibold text-white transition hover:bg-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/20 disabled:cursor-not-allowed disabled:bg-[#adbbb8]"
                          >
                            {group.isSelected ? "Selected" : "Choose group"}
                          </button>
                        </form>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
