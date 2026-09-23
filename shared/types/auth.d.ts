import type { UserRole, UserStatus } from "@prisma/client";

declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    avatar?: string | null;
    role?: UserRole | null;
    status: UserStatus;
    is_active: boolean;
    email_verified_at?: Date | null;
    last_login_at?: Date | null;
    created_at: Date;
  }

  interface UserSession {
    loggedInAt?: string;
    provider?: "email" | "github" | "google" | "facebook";
  }
}

export { User, UserSession };
