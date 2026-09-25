// One-time login for sending Telegram messages from your personal account.
// Run: pnpm telegram:login
// It prints a session string. Put it in TELEGRAM_SESSION (.env.local and Vercel).
// Anyone with that string has full access to your Telegram account: never commit or share it.
import { createInterface } from "node:readline/promises";
import { TelegramClient, sessions } from "teleproto";

const rl = createInterface({ input: process.stdin, output: process.stdout });

const apiId = Number(process.env.TELEGRAM_API_ID || (await rl.question("API ID (from my.telegram.org): ")));
const apiHash = process.env.TELEGRAM_API_HASH || (await rl.question("API hash: "));

const client = new TelegramClient(new sessions.StringSession(""), apiId, apiHash.trim(), {
  connectionRetries: 3,
});

await client.start({
  phoneNumber: () => rl.question("Phone number (e.g. +85512345678): "),
  phoneCode: () => rl.question("Login code Telegram sent you: "),
  password: (hint) => rl.question(`2FA password${hint ? ` (hint: ${hint})` : ""}: `),
  onError: (err) => console.error(err.message),
});

const me = await client.getMe();
console.log(`\nLogged in as ${me.firstName ?? ""} (@${me.username ?? "no username"})`);
console.log("\nAdd this line to .env.local and to Vercel environment variables:\n");
console.log(`TELEGRAM_SESSION=${client.session.save()}\n`);

rl.close();
await client.disconnect();
process.exit(0);
