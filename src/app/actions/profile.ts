"use server";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session.isValid || !session.user) {
    return { error: "Unauthorized" };
  }
  
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  
  if (!name) {
    return { error: "Name is required." };
  }

  const db = getDb();
  const updates: any = {};
  updates.name = name;
  
  if (password && password.trim().length > 0) {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }
  
  try {
    await db.update(users).set(updates).where(eq(users.id, session.user.id));
    
    // Update the JWT cookie with the new name
    const { createSession } = await import('@/lib/session');
    await createSession({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: name
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { error: "An unexpected error occurred." };
  }
}
