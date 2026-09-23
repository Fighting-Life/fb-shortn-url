import { readBody } from "h3";
import { generateHashPassword } from "../../../../shared/utils/password";
import { setAuthSession } from "../../../utils/auth";
import { hashInvitationToken } from "../../../utils/invitation";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || token.length < 32) {
    throw createError({ statusCode: 422, statusMessage: "Invitation token is invalid" });
  }
  if (password.length < 8) {
    throw createError({ statusCode: 422, statusMessage: "Password minimal 8 karakter" });
  }

  const invitation = await prisma.invitation.findUnique({ where: { token_hash: hashInvitationToken(token) } });
  if (!invitation || invitation.accepted_at || invitation.expires_at <= new Date()) {
    throw createError({ statusCode: 410, statusMessage: "Invitation is invalid or expired" });
  }

  const existing = await prisma.user.findUnique({ where: { email: invitation.email }, select: { id: true } });
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email sudah terdaftar" });
  }

  const passwordHash = await generateHashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        password_hash: passwordHash,
        role: invitation.role,
        status: "active",
        is_active: true,
        email_verified_at: new Date(),
      },
    });
    await tx.invitation.update({ where: { id: invitation.id }, data: { accepted_at: new Date() } });
    await tx.auditLog.create({
      data: {
        user_id: created.id,
        action: "ACCEPT",
        resource: "invitation",
        resource_id: invitation.id,
        new_value: { email: created.email, role: created.role },
      },
    });
    return created;
  });

  const session = await setAuthSession(event, user.id, true);
  return { status: 200, success: true, message: "Invitation accepted.", data: session };
});
