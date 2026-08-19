"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteCurrentSession } from "@/lib/auth/session";
import { getDefaultHomePath } from "@/lib/permissions";
import type { AccessContext } from "@/types/auth";

export type LoginState = {
  error: string | null;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      organizationMemberships: true,
      memberships: {
        include: {
          building: true,
          apartment: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or password" };
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordValid) {
    return { error: "Invalid email or password" };
  }

  const preferredBuildingId =
    user.memberships.find((membership) => membership.isActive)?.buildingId ?? null;

  await createSession(user.id, preferredBuildingId);

  const ctx: AccessContext = {
    user,
    organizationMemberships: user.organizationMemberships,
    memberships: user.memberships,
    session: { id: "", activeBuildingId: preferredBuildingId },
  };

  redirect(getDefaultHomePath(ctx));
}

export async function logout() {
  await deleteCurrentSession();
  redirect("/login");
}
