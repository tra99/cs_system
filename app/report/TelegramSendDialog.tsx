"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Send, TriangleAlert, X } from "lucide-react";
import { TELEGRAM_MESSAGE_LIMIT } from "../lib/telegramLimits";
import { sendTelegramAction, TelegramFormState } from "./telegramActions";

const INITIAL_STATE: TelegramFormState = { status: "idle", message: "" };

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0d6f66] focus:ring-2 focus:ring-[#0d6f66]/15";

export function TelegramSendButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
      >
        <Send className="size-4 text-sky-600" />
        <span>Send to Telegram</span>
      </button>
      {/* Portal to body: the sticky header's backdrop-blur would otherwise trap the fixed overlay */}
      {isOpen && createPortal(<TelegramSendDialog onClose={() => setIsOpen(false)} />, document.body)}
    </>
  );
}

function TelegramSendDialog({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");

  const [state, formAction, pending] = useActionState(
    async (prevState: TelegramFormState, formData: FormData) => {
      const result = await sendTelegramAction(prevState, formData);
      if (result.status === "sent") setBody("");
      return result;
    },
    INITIAL_STATE
  );

  // Close with Escape unless a send is in progress
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, pending]);

  const canSend = username.trim() !== "" && body.trim() !== "" && !pending;

  return (
    <div
      className="print:hidden fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-dialog-title"
        className="m-auto w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="telegram-dialog-title" className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Send className="size-4 text-sky-600" />
              Send to Telegram
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Sends from the connected Telegram account to any username.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-700">Telegram username</span>
            <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-[#0d6f66] focus-within:ring-2 focus-within:ring-[#0d6f66]/15">
              <span className="pl-3 text-sm text-slate-400">@</span>
              <input
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
                placeholder="sok_dara"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                maxLength={32}
                className="w-full rounded-lg bg-transparent px-1.5 py-2 text-sm text-slate-900 outline-none"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="flex items-center justify-between text-xs font-semibold text-slate-700">
              Message
              <span className="font-mono font-normal text-slate-400">
                {body.length}/{TELEGRAM_MESSAGE_LIMIT}
              </span>
            </span>
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              maxLength={TELEGRAM_MESSAGE_LIMIT}
              className={`${INPUT_CLASS} resize-y`}
            />
          </label>

          {state.status === "error" && (
            <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {state.message}
            </p>
          )}
          {state.status === "sent" && (
            <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
              {state.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d6f66] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#095750] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-3.5" />
              {pending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
