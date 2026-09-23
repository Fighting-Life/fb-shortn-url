export default defineNuxtRouteMiddleware(async (to, from) => {
  const { loggedIn, fetch, ready } = useUserSession();

  if (!ready.value) await fetch();

  if (!loggedIn.value) {
    return navigateTo({
      path: "/signin",
      query: { redirect: to.fullPath },
    });
  }
});
