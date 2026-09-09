"use client";

import { useFormStatus } from "react-dom";
import { submitEmailAction } from "./actions";
import { CADT_EMAIL_PATTERN } from "./lib/groups";

type LoginFormProps = {
  error?: string;
};

function ContinueButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#102622] px-5 text-sm font-semibold text-white shadow-lg shadow-[#102622]/20 transition hover:bg-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/20 disabled:cursor-wait disabled:bg-[#52615e]"
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin"
        />
      ) : null}
      {pending ? "Continuing..." : "Continue"}
    </button>
  );
}

export function LoginForm({ error }: LoginFormProps) {
  return (
    <form action={submitEmailAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-[#24423e]"
        >
          Email address
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            required
            pattern={CADT_EMAIL_PATTERN}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@cadt.edu.kh"
            title="Please use your @cadt.edu.kh email address."
            aria-describedby="email-note email-error"
            className="email-input h-14 w-full rounded-lg border border-[#b8cbc7] bg-white px-4 pr-12 text-base text-[#102622] shadow-sm outline-none transition placeholder:text-[#7d918d] focus:border-[#0d6f66] focus:ring-4 focus:ring-[#0d6f66]/15"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-7 -translate-y-1/2 text-base font-bold text-[#d59824]"
          >
            @
          </span>
          <p id="email-error" className="email-error">
            Enter a valid email ending in @cadt.edu.kh.
          </p>
        </div>
        <p id="email-note" className="mt-3 text-sm text-[#516c67]">
          Use your official CADT email to continue.
        </p>
        {error === "invalid-email" ? (
          <p className="mt-3 rounded-lg border border-[#efb6b6] bg-[#fff4f4] px-3 py-2 text-sm font-semibold text-[#b42318]">
            Please enter a valid email ending in @cadt.edu.kh.
          </p>
        ) : null}
      </div>

      <ContinueButton />
    </form>
  );
}
