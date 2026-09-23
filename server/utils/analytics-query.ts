import type { H3Event } from "h3";

export function getAnalyticsRange(event: H3Event) {
  const requestUrl = getRequestURL(event);
  const fromParam = requestUrl.searchParams.get("from");
  const toParam = requestUrl.searchParams.get("to");
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw createError({
      statusCode: 422,
      statusMessage: "Invalid analytics date range",
      data: { code: "INVALID_DATE_RANGE" },
    });
  }

  return { from, to };
}

export function sumMetric<T extends Record<string, number>>(metrics: T[], key: keyof T) {
  return metrics.reduce((total, metric) => total + Number(metric[key] || 0), 0);
}
