export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
    scope: ["read:user", "user:email"],
  },
  async onSuccess(event, { user, tokens }) {
    if (!user?.email || !user?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Github account does not provide required profile data",
        data: { code: "OAUTH_PROFILE_INCOMPLETE" },
      });
    }

    const email = user.email;
    const name =
      user.name ||
      user.login ||
      (email ? email.split("@")[0] : "user") ||
      randomBusinessName;
    const avatar = user.avatar_url || null;

    const { user: authUser } = await upsertOAuthUser({
      provider: "github",
      providerAccountId: String(user.id),
      email,
      name,
      avatar,
      tokens: {
        accessToken: tokens.access_token,
        tokenType: tokens.token_type,
        scope: tokens.scope,
      },
    });

    await setAuthSession(event, authUser.id, true);

    return sendRedirect(event, "/app");
  },
  onError(event, error) {
    const message = encodeURIComponent(error.statusMessage || "OAuth failed");
    return sendRedirect(event, `/signin?error=${message}`);
  },
});
