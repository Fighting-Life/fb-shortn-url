import { getRouterParam } from "h3";
import { apiError, apiSuccess } from "../../../utils/api";
import { writeAuditLog } from "../../../utils/audit";
import { requireAdmin } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAdmin(event);
  const id = getRouterParam(event, "id");
  const actorId = session.user?.id;

  if (!id || !actorId) apiError("INVALID_REQUEST", "User ID is required.", 400);
  if (id === actorId) apiError("SELF_DELETE", "Admin tidak dapat menghapus dirinya sendiri.", 422);

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, status: true, is_active: true },
  });
  if (!existing) apiError("USER_NOT_FOUND", "User tidak ditemukan.", 404);

  if (existing.role === "admin" && existing.status === "active" && existing.is_active) {
    const activeAdminCount = await prisma.user.count({
      where: { role: "admin", status: "active", is_active: true },
    });
    if (activeAdminCount <= 1) apiError("LAST_ADMIN", "Minimal satu admin aktif harus dipertahankan.", 422);
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: { status: "inactive", is_active: false },
    select: { id: true, name: true, email: true, role: true, status: true, is_active: true },
  });

  await writeAuditLog(event, {
    action: "DEACTIVATE",
    resource: "user",
    resourceId: updated.id,
    oldValue: existing,
    newValue: updated,
  });

  return apiSuccess(event, updated, "User deactivated successfully.");
});
