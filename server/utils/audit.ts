import type { H3Event } from "h3";
import { getClientIp } from "./api";
import { requireSession } from "./auth";

type AuditValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: AuditValue;
  newValue?: AuditValue;
}

/**
 * Writes a user-attributed audit event after validating the current session.
 * Do not pass passwords, tokens, cookies, or other secrets as audit values.
 */
export async function writeAuditLog(
  event: H3Event,
  input: AuditLogInput,
): Promise<void> {
  const session = await requireSession(event);
  const userId = session.user?.id;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Login required",
      data: { code: "UNAUTHORIZED" },
    });
  }

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: input.action,
      resource: input.resource,
      resource_id: input.resourceId,
      old_value: input.oldValue as any,
      new_value: input.newValue as any,
      ip_address: getClientIp(event),
      user_agent: getHeader(event, "user-agent")?.slice(0, 1000),
    },
  });
}
