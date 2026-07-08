import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getDb } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const db = getDb();
  const allUsers = await db.select().from(users);
  console.log("Users in database:", allUsers);
}

main();
