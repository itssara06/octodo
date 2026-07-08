import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const db = getDb();
  const email = "admin@example.com";
  const password = "password";
  
  console.log("Querying db...");
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  console.log("User:", user);
  
  if (user) {
    const match = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", match);
  }
}

main();
