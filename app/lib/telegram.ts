import { neon } from "@neondatabase/serverless";
import { isAccountConfigured, sendFromAccount } from "./telegramAccount";
import { TELEGRAM_MESSAGE_LIMIT } from "./telegramLimits";


export type SendTelegramResult =
  | { ok: true; recipient: string }
  | { ok: false; error: string };

type TelegramChat = {
  id: number;
  type: string;
  username?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: { chat: TelegramChat; from?: { username?: string } };
  my_chat_member?: { chat: TelegramChat };
};

type TelegramResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{3,31}$/;
const CHAT_ID_PATTERN = /^-?\d{5,20}$/;

let sqlClient: ReturnType<typeof neon> | undefined;
let setupPromise: Promise<void> | undefined;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) return undefined;

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}

async function ensureTable() {
  const sql = getSql();
  if (!sql) return;

  setupPromise ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS telegram_chats (
        username text PRIMARY KEY,
        chat_id bigint NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
  })();

  await setupPromise;
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN ?? "6409563841:AAEnC_7sceWiM4Pkh-ZL5KGC5gisTE1ETc0";
}

async function callTelegram<T>(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${getBotToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return (await response.json()) as TelegramResponse<T>;
}

async function getCachedChatId(username: string) {
  const sql = getSql();
  if (!sql) return undefined;

  await ensureTable();
  const rows = (await sql`
    SELECT chat_id::text AS "chatId" FROM telegram_chats WHERE username = ${username}
  `) as { chatId: string }[];

  return rows[0]?.chatId;
}

async function cacheChatIds(entries: Map<string, number>) {
  const sql = getSql();
  if (!sql || entries.size === 0) return;

  await ensureTable();
  for (const [username, chatId] of entries) {
    await sql`
      INSERT INTO telegram_chats (username, chat_id, updated_at)
      VALUES (${username}, ${chatId}, now())
      ON CONFLICT (username) DO UPDATE
      SET chat_id = EXCLUDED.chat_id, updated_at = now()
    `;
  }
}

// Scan recent bot updates for chats that have a username
async function findChatIdInUpdates(username: string) {
  const response = await callTelegram<TelegramUpdate[]>("getUpdates", {
    allowed_updates: ["message", "my_chat_member"],
  });

  // Fails with 409 when the bot uses a webhook; fall back to cached chats only
  if (!response.ok || !response.result) {
    console.error("Telegram getUpdates failed", response.description);
    return undefined;
  }

  const found = new Map<string, number>();
  for (const update of response.result) {
    const chat = update.message?.chat ?? update.my_chat_member?.chat;
    if (chat?.username) found.set(chat.username.toLowerCase(), chat.id);
  }

  await cacheChatIds(found);
  return found.get(username);
}

async function resolveChatId(recipient: string) {
  if (CHAT_ID_PATTERN.test(recipient)) return recipient;

  const username = recipient.replace(/^@/, "").toLowerCase();
  if (!USERNAME_PATTERN.test(username)) return undefined;

  const cached = await getCachedChatId(username);
  if (cached) return cached;

  const fromUpdates = await findChatIdInUpdates(username);
  if (fromUpdates !== undefined) return String(fromUpdates);

  // Public channels and groups accept @username as chat_id directly
  return `@${username}`;
}

function describeSendError(response: TelegramResponse<unknown>, recipient: string) {
  const description = response.description ?? "";

  if (/chat not found/i.test(description)) {
    return `${recipient} has not started the bot yet. Ask them to open the bot in Telegram and press Start, then send again.`;
  }
  if (/bot was blocked/i.test(description)) {
    return `${recipient} has blocked the bot.`;
  }
  if (response.error_code === 401) {
    return "Telegram bot token is invalid. Check TELEGRAM_BOT_TOKEN.";
  }
  return description || "Telegram rejected the message.";
}

export async function sendTelegramMessage(
  rawRecipient: string,
  rawText: string
): Promise<SendTelegramResult> {
  const recipient = rawRecipient.trim();
  const text = rawText.trim();

  const useAccount = isAccountConfigured();
  if (!useAccount && !getBotToken()) {
    return {
      ok: false,
      error: "Telegram is not set up. Add TELEGRAM_SESSION (personal account) or TELEGRAM_BOT_TOKEN.",
    };
  }
  if (!recipient) {
    return { ok: false, error: "Enter a Telegram username." };
  }
  if (!text) {
    return { ok: false, error: "Enter a message." };
  }
  if (text.length > TELEGRAM_MESSAGE_LIMIT) {
    return { ok: false, error: `Message is too long (max ${TELEGRAM_MESSAGE_LIMIT} characters).` };
  }

  // Personal account can reach any @username directly; the bot only reaches people who pressed Start
  if (useAccount) {
    const target = CHAT_ID_PATTERN.test(recipient) ? recipient : `@${recipient.replace(/^@/, "")}`;
    if (!CHAT_ID_PATTERN.test(recipient) && !USERNAME_PATTERN.test(target.slice(1))) {
      return { ok: false, error: "Username is not valid. Use 5-32 letters, numbers or underscores, e.g. @sok_dara." };
    }
    const result = await sendFromAccount(target, text);
    return result.ok ? { ok: true, recipient: target } : result;
  }

  try {
    const chatId = await resolveChatId(recipient);
    if (!chatId) {
      return {
        ok: false,
        error: "Username is not valid. Use 5-32 letters, numbers or underscores, e.g. @sok_dara.",
      };
    }

    const response = await callTelegram("sendMessage", { chat_id: chatId, text });
    if (!response.ok) {
      return { ok: false, error: describeSendError(response, recipient) };
    }

    return { ok: true, recipient };
  } catch (err) {
    console.error("Telegram send failed", err);
    return { ok: false, error: "Could not reach Telegram. Try again." };
  }
}
