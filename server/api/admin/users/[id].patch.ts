import { getRouterParam, readBody } from "h3";
import { apiError, apiSuccess } from "../../../utils/api";
import { writeAuditLog } from "../../../utils/audit";
import { requireAdmin } from "../../../utils/auth";

const roles = ["admin", "user"] as const;
const statuses = ["active", "inactive", "suspended"] as const;

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);
  const id = getRouterParam(event, "id");
  const actorId = session.user?.id;

  if (!id || !actorId) apiError("INVALID_REQUEST", "User ID is required.", 400);

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, status: true, is_active: true },
  });
  if (!existing) apiError("USER_NOT_FOUND", "User tidak ditemukan.", 404);

  const body = await readBody<Record<string, unknown>>(event);
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const rawRole = typeof body.role === "string" ? body.role : undefined;
  const rawStatus = typeof body.status === "string" ? body.status : undefined;
  const requestedRole = roles.includes(rawRole as (typeof roles)[number])
    ? (rawRole as (typeof roles)[number])
    : undefined;
  const requestedStatus = statuses.includes(rawStatus as (typeof statuses)[number])
    ? (rawStatus as (typeof statuses)[number])
    : undefined;
  const isActive = typeof body.is_active === "boolean" ? body.is_active : undefined;

  if (name !== undefined && (name.length < 2 || name.length > 120)) {
    apiError("VALIDATION_ERROR", "Nama user harus 2-120 karakter.", 422);
  }
  if (rawRole !== undefined && requestedRole === undefined) {
    apiError("VALIDATION_ERROR", "Role user tidak valid.", 422);
  }
  if (rawStatus !== undefined && requestedStatus === undefined) {
    apiError("VALIDATION_ERROR", "Status user tidak valid.", 422);
  }

  const nextRole = requestedRole ?? existing.role;
  const nextStatus = requestedStatus ?? existing.status;
  const nextIsActive = isActive ?? existing.is_active;

  if (existing.id === actorId && (nextRole !== "admin" || nextStatus !== "active" || !nextIsActive)) {
    apiError("SELF_LOCKOUT", "Admin tidak dapat menonaktifkan atau menurunkan role dirinya sendiri.", 422);
  }

  if (existing.role === "admin" && (nextRole !== "admin" || nextStatus !== "active" || !nextIsActive)) {
    const activeAdminCount = await prisma.user.count({
      where: { role: "admin", status: "active", is_active: true },
    });
    if (activeAdminCount <= 1) {
      apiError("LAST_ADMIN", "Minimal satu admin aktif harus dipertahankan.", 422);
    }
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(requestedRole !== undefined ? { role: nextRole } : {}),
      ...(requestedStatus !== undefined ? { status: nextStatus } : {}),
      ...(isActive !== undefined ? { is_active: nextIsActive } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      is_active: true,
    },
  });

  await writeAuditLog(event, {
    action: "UPDATE",
    resource: "user",
    resourceId: updated.id,
    oldValue: existing,
    newValue: updated,
  });

  return apiSuccess(event, updated, "User updated successfully.");
});
