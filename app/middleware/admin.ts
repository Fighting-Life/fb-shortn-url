export default defineNuxtRouteMiddleware(async () => {
  const { user, fetch, ready } = useUserSession();

  if (!ready.value) await fetch();

  if (user.value?.role !== "admin" || user.value?.status !== "active") {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not authorized to access this resource",
      fatal: true,
    });
    // return showError({ statusCode: 403, statusMessage: "You are not authorized to access this resource })
  }
});
