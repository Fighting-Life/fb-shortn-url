import { getQuery } from "h3";
import { apiSuccess } from "../../utils/api";
import { requireSession } from "../../utils/auth";
import { campaignScope, serializeCampaign } from "../../utils/campaign";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);
  const query = getQuery(event);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const statusValues = ["draft", "active", "paused", "archived", "blocked"] as const;
  const requestedStatus = typeof query.status === "string" ? query.status : undefined;
  const status = statusValues.includes(requestedStatus as (typeof statusValues)[number])
    ? (requestedStatus as (typeof statusValues)[number])
    : undefined;
  const userId = session.user?.id;
  const role = session.user?.role;

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: "Login required" });
  }

  const where = {
    deleted_at: null,
    ...campaignScope(userId, role ?? undefined),
    ...(status ? { status } : {}),
    ...(search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { short_code: { contains: search, mode: "insensitive" as const } },
        ],
      }
      : {}),
  };

  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return apiSuccess(
    event,
    { items: campaigns.map(serializeCampaign) },
    "Campaigns loaded successfully.",
    200,
    {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      has_prev: page > 1,
      has_next: page * limit < total,
      has_more: page * limit < total,
    },
  );
});
