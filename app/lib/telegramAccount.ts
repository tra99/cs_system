// Root import only: teleproto subpath imports break under Node ESM resolution
import { Logger, TelegramClient, sessions } from "teleproto";
import type { LogLevel } from "teleproto/extensions/Logger";

// Sends from a personal Telegram account (MTProto), so any @username can be
// reached without them starting a bot. Login once with `pnpm telegram:login`
// to get TELEGRAM_SESSION.

export function isAccountConfigured() {
  return Boolean(
    process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH && process.env.TELEGRAM_SESSION
  );
}

// Telegram error codes -> message for the person using the form
const ERROR_MESSAGES: Record<string, string> = {
  USERNAME_NOT_OCCUPIED: "No Telegram account uses this username.",
  USERNAME_INVALID: "Username is not valid.",
  USER_PRIVACY_RESTRICTED: "This user's privacy settings block messages from you.",
  PEER_FLOOD: "Telegram limited your account for sending too many messages to non-contacts. Wait and try later.",
  YOU_BLOCKED_USER: "You blocked this user. Unblock them in Telegram first.",
  AUTH_KEY_UNREGISTERED: "Telegram login expired. Run `pnpm telegram:login` again and update TELEGRAM_SESSION.",
  SESSION_REVOKED: "Telegram login was revoked. Run `pnpm telegram:login` again and update TELEGRAM_SESSION.",
  USER_DEACTIVATED: "The sending Telegram account is deactivated.",
};

function describeError(err: unknown) {
  const code = (err as { errorMessage?: string }).errorMessage ?? "";

  if (code.startsWith("FLOOD_WAIT")) {
    const seconds = (err as { seconds?: number }).seconds;
    return `Telegram asks to wait${seconds ? ` ${seconds} seconds` : ""} before sending again.`;
  }
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (/Cannot find any entity/i.test(String(err))) return ERROR_MESSAGES.USERNAME_NOT_OCCUPIED;
  return code || "Could not send the message with your Telegram account.";
}

export async function sendFromAccount(
  recipient: string,
  text: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Serverless: connect per request, then close so the function can finish
  const client = new TelegramClient(
    new sessions.StringSession(process.env.TELEGRAM_SESSION),
    Number(process.env.TELEGRAM_API_ID),
    process.env.TELEGRAM_API_HASH ?? "",
    { connectionRetries: 2, autoReconnect: false, baseLogger: new Logger("error" as LogLevel) }
  );

  try {
    await client.connect();
    await client.sendMessage(recipient, { message: text, parseMode: false });
    return { ok: true };
  } catch (err) {
    console.error("Telegram account send failed", err);
    return { ok: false, error: describeError(err) };
  } finally {
    await client.destroy().catch(() => undefined);
  }
}
