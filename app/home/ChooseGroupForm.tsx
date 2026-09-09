"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { chooseGroupAction } from "../actions";

type ChooseGroupFormProps = {
  groupId: string;
  track: string;
  groupName: string;
  disabled: boolean;
  buttonLabel: string;
  remaining: number;
};

export function ChooseGroupForm({
  groupId,
  track,
  groupName,
  disabled,
  buttonLabel,
  remaining,
}: ChooseGroupFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialog = (
    <div
      aria-labelledby={`confirm-title-${groupId}`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-[#102622]/55 px-5 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-[420px] rounded-lg border border-[#d7e4df] bg-white p-5 text-[#102622] shadow-[0_24px_70px_rgba(5,34,31,0.28)]">
        <p id={`confirm-title-${groupId}`} className="text-lg font-semibold">
          Confirm group choice
        </p>
        <p
          aria-live="polite"
          className="mt-3 text-sm leading-6 text-[#516c67]"
        >
          {submitting
            ? "Saving your group choice. Please wait."
            : `Choose ${track} - ${groupName}? Your selection will be locked after it is saved.`}
        </p>
        <p className="mt-3 text-sm font-semibold text-[#0d6f66]">
          {remaining} seats remaining
        </p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="h-11 rounded-lg border border-[#b8cbc7] px-4 text-sm font-semibold text-[#24423e] transition hover:border-[#0d6f66] hover:text-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/15 disabled:cursor-not-allowed disabled:border-[#d7e4df] disabled:text-[#91a19d]"
            disabled={submitting}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#102622] px-4 text-sm font-semibold text-white transition hover:bg-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/20 disabled:cursor-wait disabled:bg-[#52615e]"
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting ? (
              <span
                aria-hidden="true"
                className="size-4 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin"
              />
            ) : null}
            {submitting ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (!confirmedRef.current) {
      event.preventDefault();
      setConfirming(true);
      return;
    }

    setSubmitting(true);
  }

  function handleCancel() {
    if (submitting) {
      return;
    }

    confirmedRef.current = false;
    setConfirming(false);
  }

  function handleConfirm() {
    if (submitting) {
      return;
    }

    confirmedRef.current = true;
    setSubmitting(true);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={chooseGroupAction}
        className="mt-5"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="groupId" value={groupId} />
        <button
          type="submit"
          disabled={disabled || submitting}
          className="h-11 w-full rounded-lg bg-[#102622] px-4 text-sm font-semibold text-white transition hover:bg-[#0d6f66] focus:outline-none focus:ring-4 focus:ring-[#0d6f66]/20 disabled:cursor-not-allowed disabled:bg-[#adbbb8]"
        >
          {submitting ? "Saving..." : buttonLabel}
        </button>
      </form>

      {confirming ? createPortal(dialog, document.body) : null}
    </>
  );
}
