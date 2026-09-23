export default defineOAuthGoogleEventHandler({
  config: {
    scope: ["openid", "email", "profile"],
  },
  async onSuccess(event, { user, tokens }) {
    if (!user?.email || !user?.sub) {
      throw createError({
        statusCode: 400,
        statusMessage: "Google account does not provide required profile data",
        data: { code: "OAUTH_PROFILE_INCOMPLETE" },
      });
    }

    const expiresAt =
      tokens.expires_at ??
      tokens.expiresAt ??
      (tokens.expires_in
        ? Math.floor(Date.now() / 1000) + Number(tokens.expires_in)
        : undefined);

    const { user: authUser } = await upsertOAuthUser({
      provider: "google",
      providerAccountId: String(user.sub),
      email: String(user.email).toLowerCase().trim(),
      name: String(user.name || user.email),
      avatar: user.picture ?? null,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        idToken: tokens.id_token,
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
