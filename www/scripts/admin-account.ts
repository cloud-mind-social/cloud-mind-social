/**
 * Generates the SQL for creating an admin account or resetting a password,
 * so a password is never typed into a shell command that stores it in plain
 * text. Runs on plain Node (22+ strips the types) and shares the exact hashing
 * code the Worker uses.
 *
 *   node scripts/admin-account.ts create <email> "<Full Name>"
 *   node scripts/admin-account.ts reset  <email>
 *
 * The password is read from stdin so it stays out of shell history.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { checkPasswordStrength, hashPassword } from "../src/lib/password.ts";
import { newId } from "../src/lib/id.ts";

function usage(): never {
  console.error(
    [
      "Usage:",
      '  node scripts/admin-account.ts create <email> "<Full Name>"',
      "  node scripts/admin-account.ts reset  <email>",
    ].join("\n"),
  );
  process.exit(1);
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

const [command, email, name] = process.argv.slice(2);

if (!command || !email) usage();
if (command !== "create" && command !== "reset") usage();
if (command === "create" && !name) usage();

const rl = createInterface({ input: stdin, output: stdout, terminal: true });
const password = await rl.question("New password (input is visible): ");
rl.close();

const problem = checkPasswordStrength(password);
if (problem) {
  console.error(`\n${problem}`);
  process.exit(1);
}

const hash = await hashPassword(password);

const sql =
  command === "create"
    ? `INSERT INTO admin_users (id, email, name, password_hash) VALUES (${sqlString(
        newId("usr"),
      )}, ${sqlString(email.toLowerCase())}, ${sqlString(name)}, ${sqlString(hash)});`
    : `UPDATE admin_users SET password_hash = ${sqlString(
        hash,
      )} WHERE email = ${sqlString(email.toLowerCase())};`;

console.log(`\nRun this against the database:\n`);
console.log(`npx wrangler d1 execute cloud-mind-social --remote --command "${sql.replace(/"/g, '\\"')}"`);
console.log(`\nFor the staging database, use:`);
console.log(
  `npx wrangler d1 execute cloud-mind-social-staging --remote --command "${sql.replace(
    /"/g,
    '\\"',
  )}"`,
);
console.log(`\nOr locally:`);
console.log(`npx wrangler d1 execute cloud-mind-social --local --command "${sql.replace(/"/g, '\\"')}"`);
