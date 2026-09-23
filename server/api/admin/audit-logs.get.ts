import { getQuery } from "h3";
import { apiSuccess } from "../../utils/api";
import { requireAdmin } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
  const resource = typeof query.resource === "string" ? query.resource : undefined;
  const action = typeof query.action === "string" ? query.action : undefined;

  const where = {
    ...(resource ? { resource } : {}),
    ...(action ? { action } : {}),
  };
  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return apiSuccess(event, {
    items: logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resource_id: log.resource_id,
      old_value: log.old_value,
      new_value: log.new_value,
      user: log.user,
      created_at: log.created_at.toISOString(),
    })),
  }, "Audit logs loaded successfully.", 200, {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
    has_prev: page > 1,
    has_next: page * limit < total,
    has_more: page * limit < total,
  });
});
