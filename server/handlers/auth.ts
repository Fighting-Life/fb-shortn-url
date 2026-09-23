
import { getQuery, readBody, type H3Event } from "h3";
import {
  comparePassword,
  generateHashPassword,
} from "../../shared/utils/password";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../../shared/utils/validator";
import {
  checkRateLimit,
  getAllHeaderIdentifiers,
  handleRequestError,
} from "../utils/api";
import { buildSessionUser, setAuthSession } from "../utils/auth";
import { prisma } from "../utils/prisma";
import { generateToken } from "../utils/token";

export class AuthHandler {
  private event: H3Event;
  constructor(event: H3Event) {
    this.event = event;
  }
  async signup() {
    try {
      const config = useRuntimeConfig(this.event);

      if (!this.isRegistrationEnabled(config.ENABLE_REGISTRATION)) {
        throw createError({
          statusCode: 403,
          statusMessage: "Registration is disabled",
          data: {
            code: "REGISTRATION_DISABLED",
            message: "Registration is disabled",
          },
        });
      }

      const { clientIp: ip } = await getAllHeaderIdentifiers(this.event);
      if (!checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000))
        throw createError({
          statusCode: 429,
          statusMessage: "Too many attempts. Try again in 15 minutes.",
          data: {
            code: "RATE_LIMIT",
          },
        });

      const body = registerSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: body.error.issues.map((e) => e.message).join(", "),
          data: {
            code: "INVALID_REQUEST_BODY",
            statusMessage: body.error.issues.map((e) => e.message).join(", "),
          },
        });
      }
      const email = body.data.email.toLowerCase().trim();
      const name = body.data.full_name.trim();

      const passwordHash = await generateHashPassword(body.data.password);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw createError({
          statusCode: 409,
          statusMessage: "Email already registered",
          data: {
            code: "EMAIL_ALREADY_REGISTERED",
            message: "Email already registered",
          },
        });
      }

      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
            phone: body.data.phone || null,
            password_hash: passwordHash,
            last_login_at: new Date(),
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            email_verified_at: true,
            is_active: true,
          },
        });

        return createdUser;
      });

      const session = await setAuthSession(this.event, user.id);

      const token = generateToken(32);
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.verificationToken.deleteMany({
        where: { identifier: user.email },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires,
        },
      });

      const baseUrl =
        config.public.PUBLIC_SITE_URL ||
        config.PUBLIC_SITE_URL ||
        "http://localhost:5000";

      const url = `${baseUrl.replace(/\/$/, "")}/confirm?token=${encodeURIComponent(token)}`;

      const { sendMail } = useNodeMailer();

      try {
        sendMail({
          subject: `Verify your email address – ${config.APP_NAME}`,
          text: `Verify your email: ${url}`,
          to: user.email,
        });
      } catch (err) {
        console.error(err);
      }

      return {
        ok: true,
        user: session.user,
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }
  async login() {
    try {
      const { clientIp: ip } = await getAllHeaderIdentifiers(this.event);
      if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many attempts. Try again in 15 minutes.",
          data: {
            code: "RATE_LIMIT",
          },
        });
      }

      const body = loginSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: body.error.issues.map((e) => e.message).join(", "),
          data: {
            code: "INVALID_REQUEST_BODY",
            statusMessage: body.error.issues.map((e) => e.message).join(", "),
          },
        });
      }

      const email = body.data.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          password_hash: true,
          status: true,
          is_active: true,
        },
      });

      if (!user?.password_hash) {
        throw createError({
          statusCode: 401,
          statusMessage: "Invalid email or password",
          data: { code: "INVALID_CREDENTIALS" },
        });
      }

      if (!user.is_active || user.status !== "active") {
        throw createError({
          statusCode: 403,
          statusMessage: "Account is disabled",
          data: { code: "ACCOUNT_DISABLED" },
        });
      }

      const validPassword = await comparePassword(
        body.data.password,
        user.password_hash,
      );

      if (!validPassword) {
        throw createError({
          statusCode: 401,
          statusMessage: "Invalid email or password",
          data: { code: "INVALID_CREDENTIALS" },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });

      const session = await setAuthSession(
        this.event,
        user.id,
        body.data.remember_me,
      );

      return {
        ok: true,
        user: session.user,
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }
  async forgot() {
    try {
      const { clientIp: ip } = await getAllHeaderIdentifiers(this.event);
      if (!checkRateLimit(`forgot:${ip}`, 10, 15 * 60 * 1000)) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many requests, please try again later",
          data: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, please try again later",
          },
        });
      }

      const body = forgotPasswordSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: body.error.issues
            .map((issue) => issue.message)
            .join(", "),
          data: {
            code: "INVALID_REQUEST",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }

      const email = body.data.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.is_active || !user.password_hash) {
        throw createError({
          statusCode: 404,
          statusMessage: "User not found or account is disabled",
          data: {
            code: "USER_NOT_FOUND",
            message: "User not found or account is disabled",
          },
        });
      }

      const token = generateToken(32);
      const expires = new Date(Date.now() + 1000 * 60 * 60);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, used: false },
      });

      await prisma.passwordResetToken.create({
        data: {
          token,
          user_id: user.id,
          expires,
          used: false,
        },
      });

      const config = useRuntimeConfig();
      const baseUrl = config.public.PUBLIC_SITE_URL || "http://localhost:5000";
      const url = `${baseUrl.replace(/\/$/, "")}/reset?token=${encodeURIComponent(token)}`;

      const { sendMail } = useNodeMailer();

      try {
        await sendMail({
          subject: `Reset your password – ${config.APP_NAME}`,
          text: `Reset your password: ${url}`,
          to: user.email,
        });
      } catch (err) {
        console.error(err);
      }

      return {
        success: true,
        message: "Password reset email sent successfully.",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }
  async reset() {
    try {
      const body = resetPasswordSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: body.error.issues
            .map((issue) => issue.message)
            .join(", "),
          data: {
            code: "INVALID_REQUEST",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: body.data.token.trim() },
        include: { user: true },
      });
      if (
        !resetToken ||
        resetToken.used ||
        resetToken.expires.getTime() < Date.now()
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "Reset token is invalid or has expired",
          data: {
            code: "RESET_TOKEN_INVALID",
            message: "Reset token is invalid or has expired",
          },
        });
      }

      const user = resetToken.user;
      if (!user.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: "User account is disabled",
          data: {
            code: "USER_ACCOUNT_DISABLED",
            message: "User account is disabled",
          },
        });
      }

      const isSame = await comparePassword(
        body.data.new_password,
        user.password_hash || "",
      );
      if (isSame) {
        throw createError({
          statusCode: 400,
          statusMessage: "New password cannot be the same as old password",
          data: {
            code: "NEW_PASSWORD_SAME_OLD_PASSWORD",
            message: "New password cannot be the same as old password",
          },
        });
      }

      const passwordHash = await generateHashPassword(body.data.new_password);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            password_hash: passwordHash,
          },
        });
        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id, used: false },
        });
      });

      return {
        ok: true,
        message: "Password reset successful.",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async confirmEmail() {
    try {
      const body = verifyEmailSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid input",
          data: {
            code: "INVALID_REQUEST",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }

      const token = body.data.token.trim();
      const query = getQuery(this.event);

      const verification = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verification || verification.expires.getTime() < Date.now()) {
        throw createError({
          statusCode: 400,
          statusMessage: "Verification link is invalid or has expired",
          data: {
            code: "VERIFICATION_LINK_INVALID",
            message: "Verification link is invalid or has expired",
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: verification.identifier },
      });

      if (!user) {
        throw createError({
          statusCode: 400,
          statusMessage: "User not found",
          data: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.update({
          where: { id: user.id },
          data: {
            email_verified_at: user.email_verified_at ?? new Date(),
            is_active: true,
          },
        });
        await tx.verificationToken.delete({
          where: { token },
        });

        return { user: newUser };
      });

      const sessionData = {
        user: buildSessionUser(result.user),
        loggedInAt: new Date().toISOString(),
      };

      await setUserSession(this.event, sessionData);

      return {
        success: true,
        message: "Email verified successfully.",
        data: {
          redirectUrl: "/app",
        },
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }

  async resendEmail() {
    try {
      const { clientIp } = await getAllHeaderIdentifiers(this.event);
      if (!checkRateLimit(`resend-email:${clientIp}`, 10, 15 * 60 * 1000)) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too many requests, please try again later",
          data: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, please try again later",
          },
        });
      }

      const body = resendEmailSchema.safeParse(await readBody(this.event));
      if (!body.success) {
        throw createError({
          statusCode: 400,
          statusMessage: body.error.issues
            .map((issue) => issue.message)
            .join(", "),
          data: {
            code: "INVALID_REQUEST",
            message: body.error.issues.map((issue) => issue.message).join(", "),
          },
        });
      }
      const email = body.data.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email },
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
      if (!user.is_active) {
        throw createError({
          statusCode: 403,
          statusMessage: "Account is disabled",
          data: {
            code: "ACCOUNT_DISABLED",
            message: "Account is disabled",
          },
        });
      }
      if (user.email_verified_at) {
        throw createError({
          statusCode: 403,
          statusMessage: "Email already confirmed",
          data: {
            code: "EMAIL_ALREADY_VERIFIED",
            message: "Email already confirmed",
          },
        });
      }

      const token = generateToken(32);
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

      await prisma.verificationToken.deleteMany({
        where: { identifier: user.email },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires,
        },
      });

      const config = useRuntimeConfig();
      const baseUrl =
        config.public.PUBLIC_SITE_URL ||
        config.PUBLIC_SITE_URL ||
        "http://localhost:5000";
      const url = `${baseUrl.replace(/\/$/, "")}/confirm?token=${encodeURIComponent(token)}`;

      const { sendMail } = useNodeMailer();

      try {
        await sendMail({
          subject: `Verify your email address – ${config.APP_NAME}`,
          text: `Verify your email: ${url}`,
          to: user.email,
        });
      } catch (err) {
        console.error(err);
      }

      return {
        success: true,
        message: "Verification email sent successfully.",
      };
    } catch (error) {
      throw handleRequestError(error);
    }
  }
  private isRegistrationEnabled(value: unknown) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return ["1", "true", "yes", "on"].includes(value.toLowerCase());
    }
    return false;
  }
}
