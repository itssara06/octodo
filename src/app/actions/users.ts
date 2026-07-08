"use server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { desc } from "drizzle-orm";

export async function getUsers() {
  const session = await getSession();
  if (!session.isValid || session.user?.role?.toLowerCase() !== 'admin') {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  // Fetch users excluding the password hash
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));

  return allUsers;
}

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (!session.isValid || session.user?.role?.toLowerCase() !== 'admin') {
    throw new Error("Unauthorized");
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string; // 'Admin' or 'User'

  if (!email || !password || !role) {
    throw new Error("Missing required fields");
  }

  const db = getDb();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    id: uuidv4(),
    email,
    passwordHash,
    name: email.split('@')[0], // Simple default name based on email
    role,
    status: "Active",
    createdAt: new Date(),
  });

  revalidatePath("/users");
}
