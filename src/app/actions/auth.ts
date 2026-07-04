"use server";

import { createServerClient } from "@/lib/pb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const pb = await createServerClient();

  try {
    await pb.collection("users").authWithPassword(email, password);
    // Setting cookie explicitly in server action as fallback
    const cookieStore = await cookies();
    const cookieValue = JSON.stringify({ token: pb.authStore.token, model: pb.authStore.model });
    cookieStore.set('pb_auth', cookieValue, { httpOnly: true, path: '/' });
  } catch (err: any) {
    console.error("Login Error:", err);
    return { error: "Invalid credentials or user does not exist." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const pb = await createServerClient();
  pb.authStore.clear();
  
  const cookieStore = await cookies();
  cookieStore.delete('pb_auth');
  
  redirect("/login");
}
