import Image from "next/image";
import { redirect } from "next/navigation";
import { getStudentEmailFromCookie } from "../actions";
import { getGroupSelectionData } from "../lib/students";
import { ChooseGroupForm } from "./ChooseGroupForm";

export const dynamic = "force-dynamic";

type HomeSearchParams = Promise<{
  error?: string | string[];
  selected?: string | string[];
}>;

const messages: Record<string, string> = {
  full: "That group is already full. Please choose another available group.",
  "invalid-email": "Please enter your CADT email again before choosing a group.",
  "invalid-group": "That group choice is not available.",
  "already-selected": "You already chose a group. Your selection is locked.",
  "email-locked": "This session is already linked to the email shown here.",
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
  const hasChosenGroup = Boolean(student?.groupId);
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
            {student?.groupId ? (
              <div className="rounded-lg border border-[#f0c66d]/40 bg-[#f0c66d]/18 px-4 py-3 text-left sm:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f0c66d]">
                  Your choice
                </p>
                <p className="mt-1 font-semibold text-white">
                  {student.track} - {student.groupName}
                </p>
              </div>
            ) : null}
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
                    const lockedByChoice = hasChosenGroup && !group.isSelected;
                    const buttonDisabled =
                      soldOut || lockedByChoice || group.isSelected;
                    const fillPercent = Math.min(
                      100,
                      Math.round((group.taken / group.capacity) * 100),
                    );

                    return (
                      <article
                        key={group.id}
                        className={`rounded-lg border p-5 shadow-sm transition ${
                          group.isSelected
                            ? "border-[#0d6f66] bg-[#f7fffb] ring-4 ring-[#0d6f66]/12"
                            : "border-[#d7e4df] bg-white"
                        } ${
                          lockedByChoice
                            ? "opacity-65"
                            : "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#102622]/8"
                        }`}
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
                                : group.isSelected
                                  ? "#dff6ed"
                                : group.softAccent,
                              color: soldOut ? "#b42318" : group.accent,
                            }}
                          >
                            {group.isSelected
                              ? "Your choice"
                              : soldOut
                                ? "Full"
                                : "In stock"}
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

                        <ChooseGroupForm
                          groupId={group.id}
                          track={group.track}
                          groupName={group.groupName}
                          disabled={buttonDisabled}
                          buttonLabel={
                            group.isSelected
                              ? "Your choice"
                              : lockedByChoice
                                ? "Already chosen"
                                : "Choose group"
                          }
                          remaining={group.remaining}
                        />
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
