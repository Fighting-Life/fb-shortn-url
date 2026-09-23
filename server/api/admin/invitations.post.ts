import { readBody } from "h3";
import { apiError, apiSuccess } from "../../utils/api";
import { writeAuditLog } from "../../utils/audit";
import { requireAdmin } from "../../utils/auth";
import { createInvitationToken } from "../../utils/invitation";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);
  const actorId = session.user?.id;
  if (!actorId) apiError("UNAUTHORIZED", "Login required.", 401);

  const body = await readBody<Record<string, unknown>>(event);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role === "admin" ? "admin" : "user";

  if (!/^\S+@\S+\.\S+$/.test(email)) apiError("VALIDATION_ERROR", "Email tidak valid.", 422);
  if (name.length < 2 || name.length > 120) apiError("VALIDATION_ERROR", "Nama harus 2-120 karakter.", 422);

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) apiError("EMAIL_EXISTS", "Email sudah terdaftar.", 409);

  const pendingInvitation = await prisma.invitation.findFirst({
    where: { email, accepted_at: null, expires_at: { gt: new Date() } },
  });
  if (pendingInvitation) apiError("INVITATION_EXISTS", "Undangan aktif untuk email ini sudah ada.", 409);

  const { token, tokenHash } = createInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.invitation.create({
    data: {
      email,
      name,
      role,
      token_hash: tokenHash,
      expires_at: expiresAt,
      invited_by_id: actorId,
    },
  });

  const config = useRuntimeConfig();
  const baseUrl = config.public.PUBLIC_SITE_URL || getRequestURL(event).origin;
  const invitationUrl = `${baseUrl.replace(/\/$/, "")}/invite?token=${encodeURIComponent(token)}`;
  let emailSent = false;

  try {
    const { sendMail } = useNodeMailer();
    await sendMail({
      to: email,
      subject: `You are invited to ${config.APP_NAME || "the dashboard"}`,
      text: `Hello ${name},\n\nYou have been invited to join the dashboard. Accept your invitation here:\n${invitationUrl}\n\nThis invitation expires in 7 days.`,
    });
    emailSent = true;
  } catch (error) {
    console.error("Failed to send invitation email", error);
  }

  await writeAuditLog(event, {
    action: "INVITE",
    resource: "invitation",
    resourceId: invitation.id,
    newValue: { email, role, expires_at: expiresAt.toISOString(), email_sent: emailSent },
  });

  return apiSuccess(event, {
    id: invitation.id,
    email,
    role,
    expires_at: expiresAt.toISOString(),
    email_sent: emailSent,
  }, emailSent ? "Invitation sent successfully." : "Invitation created, but email delivery failed.", 201);
});
