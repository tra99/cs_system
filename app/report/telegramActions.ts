"use server";

import { sendTelegramMessage } from "../lib/telegram";

export type TelegramFormState = {
  status: "idle" | "sent" | "error";
  message: string;
};

export async function sendTelegramAction(
  _prevState: TelegramFormState,
  formData: FormData
): Promise<TelegramFormState> {
  const result = await sendTelegramMessage(
    String(formData.get("username") ?? ""),
    String(formData.get("body") ?? "")
  );

  if (!result.ok) return { status: "error", message: result.error };
  return { status: "sent", message: `Message sent to ${result.recipient}.` };
}
