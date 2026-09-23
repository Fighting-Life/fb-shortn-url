export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user } = useUserSession();

  if (user.value?.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not authorized to access this resource",
      fatal: true,
    });
    // return showError({ statusCode: 403, statusMessage: "You are not authorized to access this resource })
  }
});
