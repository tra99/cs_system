"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isCadtEmail, normalizeEmail } from "./lib/groups";
import { chooseStudentGroup, saveStudentEmail } from "./lib/students";

const studentEmailCookie = "student_email";

export async function submitEmailAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const cookieStore = await cookies();
  const currentEmail = cookieStore.get(studentEmailCookie)?.value ?? "";

  if (
    isCadtEmail(currentEmail) &&
    normalizeEmail(currentEmail) !== email
  ) {
    redirect("/home?error=email-locked");
  }

  if (!isCadtEmail(email)) {
    redirect("/?error=invalid-email");
  }

  const saved = await saveStudentEmail(email);

  if (!saved) {
    redirect("/?error=invalid-email");
  }

  cookieStore.set(studentEmailCookie, email, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/home");
  redirect("/home");
}

export async function chooseGroupAction(formData: FormData) {
  const cookieStore = await cookies();
  const email = cookieStore.get(studentEmailCookie)?.value ?? "";
  const groupId = String(formData.get("groupId") ?? "");
  const result = await chooseStudentGroup(email, groupId);

  revalidatePath("/home");

  if (!result.ok) {
    redirect(`/home?error=${result.reason}`);
  }

  redirect("/home?selected=1");
}

export async function getStudentEmailFromCookie() {
  const cookieStore = await cookies();
  const email = cookieStore.get(studentEmailCookie)?.value ?? "";

  if (!isCadtEmail(email)) {
    return "";
  }

  return email;
}
