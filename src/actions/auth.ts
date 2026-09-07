"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthResult = { error?: string; message?: string };

export type LoginResult = AuthResult;

function readCredentials(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return null;
  }

  return { email: email.trim(), password };
}

export async function login(
  _previousState: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: "Invalid email or password." };
  }

  const requestedPath = formData.get("next");
  const destination =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
      ? requestedPath
      : "/";

  redirect(destination);
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const credentials = readCredentials(formData);
  const confirmPassword = formData.get("confirmPassword");

  if (!credentials) {
    return { error: "Email and password are required." };
  }

  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return { error: "Please confirm your password." };
  }

  if (credentials.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (credentials.password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error || !data.user) {
    return { error: "Unable to create your account. Please try again." };
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  redirect("/login?registered=1");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
