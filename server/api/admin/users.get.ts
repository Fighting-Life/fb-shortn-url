import { getQuery } from "h3";
import { apiSuccess } from "../../utils/api";
import { requireAdmin } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const statusValues = ["active", "inactive", "suspended"] as const;
  const roleValues = ["admin", "user"] as const;
  const requestedStatus = typeof query.status === "string" ? query.status : undefined;
  const requestedRole = typeof query.role === "string" ? query.role : undefined;
  const status = statusValues.includes(requestedStatus as (typeof statusValues)[number])
    ? (requestedStatus as (typeof statusValues)[number])
    : undefined;
  const role = roleValues.includes(requestedRole as (typeof roleValues)[number])
    ? (requestedRole as (typeof roleValues)[number])
    : undefined;

  const where = {
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
    ...(status ? { status } : {}),
    ...(role ? { role } : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        is_active: true,
        email_verified_at: true,
        last_login_at: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return apiSuccess(event, {
    items: users.map((user) => ({
      ...user,
      email_verified_at: user.email_verified_at?.toISOString() ?? null,
      last_login_at: user.last_login_at?.toISOString() ?? null,
      created_at: user.created_at.toISOString(),
    })),
  }, "Users loaded successfully.", 200, {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
    has_prev: page > 1,
    has_next: page * limit < total,
    has_more: page * limit < total,
  });
});
