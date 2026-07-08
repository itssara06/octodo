import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb } from "../src/db";
import { users } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error("Usage: npm run create-user <email> <password>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const db = getDb();
    await db.insert(users).values({
      id: uuidv4(),
      email,
      passwordHash,
      name: "Admin User",
      role: "Admin",
      status: "Active",
      createdAt: new Date(),
    });
    console.log(`Successfully created user: ${email}`);
  } catch (err) {
    console.error("Error creating user:", err);
  }
}

main();
