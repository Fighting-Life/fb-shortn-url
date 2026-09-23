export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, fetch, ready } = useUserSession();

  if (!ready.value) await fetch();

  if (loggedIn.value) {
    const redirect =
      typeof to.query.redirect === "string" ? to.query.redirect : "/";
    return navigateTo(redirect);
  }
});
