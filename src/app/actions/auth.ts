"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, clearSession } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string || "").trim();
  const password = formData.get("password") as string;
  
  console.log("Login attempt for:", email, "DB URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    console.log("User found in DB:", !!user);

    if (!user) {
      return { error: "Invalid credentials or user does not exist." };
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Passwords match:", passwordsMatch);

    if (!passwordsMatch) {
      return { error: "Invalid credentials or user does not exist." };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role
    });

  } catch (err: any) {
    console.error("Login Error:", err);
    return { error: "An unexpected error occurred: " + (err.message || String(err)) };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
