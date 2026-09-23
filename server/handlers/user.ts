import { getRouterParam, readBody, type H3Event } from "h3";
import {
  updateAvatarOnlySchema,
  updateProfileSchema,
} from "../../shared/utils/validator";
import { getAllHeaderIdentifiers, handleRequestError } from "../utils/api";
import {
  buildSessionUser,
  getSessionFromContext,
  requireAdmin,
} from "../utils/auth";
import { prisma } from "../utils/prisma";

export class UserHandler {
  private event: H3Event;
  constructor(event: H3Event) {
    this.event = event;
  }

  async getUser() {
    try {
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });

      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: "User tidak ditemukan",
          data: {
            code: "USER_NOT_FOUND",
            message: "User tidak ditemukan",
          },
        });
      }

      user.password_hash = null;

      return user;
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async updateAvatar() {
    try {
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const body = updateAvatarOnlySchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid avatar URL",
          data: {
            code: "INVALID_AVATAR_URL",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          avatar: body.data.avatar,
        },
      });

      updatedUser.password_hash = null;
      const { locationClient } = await getAllHeaderIdentifiers(this.event);

      await setUserSession(this.event, {
        ...session,
        user: buildSessionUser(updatedUser),
        provider: session.provider,
        loggedInAt: session.loggedInAt,
      });

      return {
        success: true,
        message: "Avatar updated successfully",
        data: {
          avatarUrl: updatedUser.avatar,
        },
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async updateProfile() {
    try {
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const body = updateProfileSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid profile data",
          data: {
            code: "INVALID_PROFILE_DATA",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: body.data.full_name,
          email: body.data.email,
          phone: body.data.phone || null,
        },
      });

      updatedUser.password_hash = null;
      await getAllHeaderIdentifiers(this.event);

      await setUserSession(this.event, {
        ...session,
        user: buildSessionUser(updatedUser),
        provider: session.provider,
        loggedInAt: session.loggedInAt,
      });

      return {
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async changePassword() {
    try {
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const body = updatePasswordSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid password data",
          data: {
            code: "INVALID_PASSWORD_DATA",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });
      if (!user) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
          data: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }
      if (!user.password_hash) {
        throw createError({
          statusCode: 400,
          statusMessage: "User doesn't have password hash",
          data: {
            code: "USER_NOT_HAS_PASSWORD_HASH",
            message: "User doesn't have password hash",
          },
        });
      }

      if (
        !(await comparePassword(body.data.current_password, user.password_hash))
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Current password is incorrect",
          data: {
            code: "CURRENT_PASSWORD_INCORRECT",
            message: "Current password is incorrect",
          },
        });
      }
      const newHash = await generateHashPassword(body.data.new_password);
      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          passwordHash: newHash,
        },
      });

      const config = useRuntimeConfig();
      const { clientIp, userAgent, locationClient } =
        await getAllHeaderIdentifiers(this.event);


      clearUserSession(this.event);

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async deleteAccount() {
    try {
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const exist = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });
      if (!exist) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found",
          data: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      if (!exist.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: "User is not active",
          data: {
            code: "USER_NOT_ACTIVE",
            message: "User not active",
          },
        });
      }

      await prisma.user.delete({
        where: { id: currentUser.id },
        include: {
          accounts: true,
          systemLogs: true,
          auditLogs: true,
          passwordResetTokens: true,
          quota: true,
        },
      });

      const config = useRuntimeConfig();


      return {
        success: true,
        message: "Account deleted successfully",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async assignRole() {
    try {
      await requireAdmin(this.event);
      const session = await getSessionFromContext(this.event);
      const currentUser = session.user;
      if (!currentUser) {
        throw createError({
          statusCode: 401,
          statusMessage: "User not logged in",
          data: {
            code: "USER_NOT_LOGGED_IN",
            message: "User not logged in",
          },
        });
      }

      const userId = getRouterParam(this.event, "id")!;
      if (userId === currentUser.id) {
        throw createError({
          statusCode: 400,
          statusMessage: "You can't assign role to yourself",
          data: {
            code: "CANNOT_ASSIGN_ROLE_TO_SELF",
            message: "You can't assign role to yourself",
          },
        });
      }

      if (
        currentUser.role === "admin"
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "You can't assign role to admin or superadmin",
          data: {
            code: "CANNOT_ASSIGN_ROLE_ADMIN_OR_SUPERADMIN",
            message: "You can't assign role to admin or superadmin",
          },
        });
      }

      const body = assignRoleSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid role data",
          data: {
            code: "INVALID_ROLE_DATA",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user || !user.is_active) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found or inactive status",
          data: {
            code: "USER_NOT_FOUND",
            message: "User not found or inactive status",
          },
        });
      }

      if (user.role === body.data.role) {
        throw createError({
          statusCode: 400,
          statusMessage: "User already has this role",
          data: {
            code: "USER_ALREADY_HAS_ROLE",
            message: "User already has this role",
          },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          role: body.data.role,
        },
      });

      return {
        success: true,
        message: "Role assigned successfully",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }
}
