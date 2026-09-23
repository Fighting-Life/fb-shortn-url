import type { User, UserSession } from "#auth-utils";
import type { UserRole } from "@prisma/client";
import type { H3Event } from "h3";
import { generateHashPassword, generateRandomPassword } from "../../shared/utils/password";
import { prisma } from "./prisma";
type PrismaLike = typeof prisma;

type OAuthProvider = "github" | "google";

type OAuthTokenInput = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
};

export const ROLE_LEVELS: Record<UserRole, number> = {
  admin: 0,
  user: 1,
};

export const USER_ROLES: UserRole[] = [
  "admin" as UserRole,
  "user" as UserRole,
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function getUserForSession(
  userId: string,
  db: PrismaLike = prisma,
) {
  return db.user.findUnique({
    where: { id: userId },
  });
}

export function buildSessionUser(
  user: NonNullable<Awaited<ReturnType<typeof getUserForSession>>>,
) {
  return user
}

export async function setAuthSession(
  event: any,
  userId: string,
  remember = false,
) {
  const user = await getUserForSession(userId);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: { code: "USER_NOT_FOUND" },
    });
  }

  if (!user.is_active || user.status !== "active") {
    throw createError({
      statusCode: 403,
      statusMessage: "Account is disabled",
      data: { code: "ACCOUNT_DISABLED" },
    });
  }

  const sessionData = {
    user: buildSessionUser(user),
    loggedInAt: new Date().toISOString(),
  };

  await setUserSession(
    event,
    sessionData,
    remember ? { maxAge: 60 * 60 * 24 * 30 } : undefined,
  );

  return sessionData;
}

export async function upsertOAuthUser(params: {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  avatar?: string | null;
  tokens?: OAuthTokenInput;
}) {
  const now = new Date();
  const expiresAt =
    params.tokens?.expiresAt != null
      ? Math.floor(params.tokens.expiresAt)
      : undefined;

  const accountExisting = await prisma.account.findFirst({
    where: {
      provider: params.provider,
      provider_account_id: params.providerAccountId,
    },
    include: {
      user: true,
    },
  });

  if (accountExisting) {
    const [account] = await prisma.$transaction([
      prisma.account.update({
        where: { id: accountExisting.id },
        data: {
          access_token: params.tokens?.accessToken,
          refresh_token: params.tokens?.refreshToken,
          expires_at: expiresAt,
          token_type: params.tokens?.tokenType,
          scope: params.tokens?.scope,
          id_token: params.tokens?.idToken,
        },
      }),
      prisma.user.update({
        where: { id: accountExisting.user_id },
        data: {
          last_login_at: now,
          name: params.name,
          avatar: params.avatar ?? accountExisting.user.avatar,
          email_verified_at: accountExisting.user.email_verified_at ?? now,
        },
      }),
    ]);

    const user = await getUserForSession(accountExisting.user_id);
    if (!user) throw new Error("OAuth user tidak ditemukan");

    return { account, user };
  }

  const userByEmail = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (userByEmail) {
    const [account] = await prisma.$transaction([
      prisma.account.create({
        data: {
          user_id: userByEmail.id,
          type: "oauth",
          provider: params.provider,
          provider_account_id: params.providerAccountId,
          access_token: params.tokens?.accessToken,
          refresh_token: params.tokens?.refreshToken,
          expires_at: expiresAt,
          token_type: params.tokens?.tokenType,
          scope: params.tokens?.scope,
          id_token: params.tokens?.idToken,
        },
      }),
      prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          last_login_at: now,
          name: params.name,
          avatar: params.avatar ?? userByEmail.avatar,
          email_verified_at: userByEmail.email_verified_at ?? now,
        },
      }),
    ]);

    const user = await getUserForSession(userByEmail.id);
    if (!user) throw new Error("OAuth user tidak ditemukan");

    return { account, user };
  }

  const result = await prisma.$transaction(async (tx) => {
    const password = generateRandomPassword();
    const passwordHash = await generateHashPassword(password);
    const user = await tx.user.create({
      data: {
        name: params.name,
        email: params.email,
        password_hash: passwordHash,
        avatar: params.avatar ?? null,
        email_verified_at: now,
        last_login_at: now,
      },
    });

    const account = await tx.account.create({
      data: {
        user_id: user.id,
        type: "oauth",
        provider: params.provider,
        provider_account_id: params.providerAccountId,
        access_token: params.tokens?.accessToken,
        refresh_token: params.tokens?.refreshToken,
        expires_at: expiresAt,
        token_type: params.tokens?.tokenType,
        scope: params.tokens?.scope,
        id_token: params.tokens?.idToken,
      },
    });

    return { user, account };
  });

  const user = await getUserForSession(result.user.id);
  if (!user) throw new Error("OAuth user tidak ditemukan");

  return { account: result.account, user };
}

export function hasMinRole(
  currentRole: string | undefined,
  minRole: UserRole,
): boolean {
  const current = (currentRole ?? "user") as UserRole;
  const level = ROLE_LEVELS[current] ?? ROLE_LEVELS.user;
  return level <= ROLE_LEVELS[minRole];
}
export function usAdmin(currentRole: UserRole | undefined): boolean {
  return currentRole === "admin";
}
export function isUser(currentRole: UserRole | undefined): boolean {
  return currentRole === "user";
}
export function getSessionRole(session: UserSession): UserRole {
  const roleName = session?.user?.role || "user";
  if (!USER_ROLES.includes(roleName as UserRole)) return "user";
  return roleName as UserRole;
}

export async function requireSession(event: H3Event) {
  const session = await getUserSession(event);
  if (!session?.user) {
    clearUserSession(event);
    throw createError({
      statusCode: 401,
      statusMessage: "Login required",
      data: {
        success: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    clearUserSession(event);
    throw createError({
      statusCode: 403,
      statusMessage: "User not found",
      data: {
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    });
  }

  if (!user.is_active || user.status !== "active") {
    clearUserSession(event);
    throw createError({
      statusCode: 403,
      statusMessage: "Account is disabled",
      data: {
        success: false,
        code: "ACCOUNT_DISABLED",
        message: "Account is disabled",
      },
    });
  }

  event.context.userSession = session;
  event.context.currentUser = session.user;

  return session;
}
export async function getSessionFromContext(
  event: H3Event,
): Promise<UserSession> {
  if (event.context.userSession && event.context.userSession.user) {
    return event.context.userSession;
  }

  const session = await requireSession(event);
  event.context.userSession = session;

  return session;
}
export async function getCurrentUserFromContext(event: H3Event): Promise<User> {
  if (event.context.currentUser) {
    return event.context.currentUser;
  }

  let session = event.context.userSession;

  if (!session) {
    session = await getSessionFromContext(event);
  }

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Login required",
      data: {
        success: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      },
    });
  }

  event.context.currentUser = session.user;

  return session.user;
}
export async function requireRole(event: H3Event, minRole: UserRole) {
  const session = await requireSession(event);
  const role = getSessionRole(session);
  if (!hasMinRole(role, minRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Minimum role required: ${minRole}`,
      data: {
        success: false,
        code: "FORBIDDEN",
        message: `Minimum role required: ${minRole}`,
        currentRole: role,
        requiredRole: minRole,
      },
    });
  }
  return session;
}

export async function requireAdmin(event: H3Event) {
  const adminName: UserRole[] = ["admin"];

  const session = await requireSession(event);
  const role = getSessionRole(session);
  if (!adminName.includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin role required",
      data: {
        success: false,
        code: "FORBIDDEN",
        message: "Admin role required",
        currentRole: role,
        requiredRole: adminName.join(","),
      },
    });
  }
  return session;
}
export async function requireUser(event: H3Event) {
  return requireRole(event, "user" as UserRole);
}
