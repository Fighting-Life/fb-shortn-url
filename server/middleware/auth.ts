import { getRequestHeader, getRequestURL, sendRedirect } from "h3";

const publicApiPrefixes = ["/api/auth/", "/api/_auth/", "/api/public/"];
const guestPagePrefixes = [
  "/signin",
  "/signup",
  "/forgot",
  "/reset",
  "/confirm",
  "/two-factor",
];
const protectedPagePrefixes = ["/app/"];
const protectedAdminPagePrefixes = ["/app/users", "/app/settings"];

const protectedUserApiPrefixes = ["/api/user/", "/api/analytic/"];
const protectedAdminApiPrefixes = [
  "/api/setting/",
  "/api/role/",
  "/api/admin/",
];

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const path = url.pathname;

  if (path.startsWith("/api/")) {
    if (publicApiPrefixes.some((p) => path.startsWith(p))) return;
    await requireSession(event);

    if (protectedAdminApiPrefixes.some((p) => path.startsWith(p))) {
      await requireAdmin(event);
      return;
    }

    return;
  }

  if (protectedPagePrefixes.some((p) => path.startsWith(p))) {
    try {
      await requireSession(event);
    } catch {
      const accept = getRequestHeader(event, "accept") || "";
      if (!accept.includes("text/html")) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
      }
      const redirectTo = encodeURIComponent(path + url.search);
      return sendRedirect(event, `/signin?redirect=${redirectTo}`);
    }
  }

  if (protectedAdminPagePrefixes.some((p) => path.startsWith(p))) {
    try {
      await requireAdmin(event);
    } catch {
      const accept = getRequestHeader(event, "accept") || "";
      if (!accept.includes("text/html")) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
      }

      const session = await getUserSession(event).catch(() => null);
      if (!session?.user) {
        const redirectTo = encodeURIComponent(path + url.search);
        return sendRedirect(event, `/signin?redirect=${redirectTo}`);
      }

      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden: You do not have access to the Admin page.",
      });
    }
  }

  if (guestPagePrefixes.some((p) => path.startsWith(p))) {
    try {
      const session = await getUserSession(event);
      if (!session?.user) return;

      const redirect = url.searchParams.get("redirect") || "/app/chats";
      return sendRedirect(event, redirect);
    } catch {
      return; // continue to login page
    }
  }
});
