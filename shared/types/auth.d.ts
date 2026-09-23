import type { UserRole, UserStatus } from "@prisma/client";

declare module "#auth-utils" {
  interface User {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    avatar_url?: string | null;
    role?: UserRole | null;
    status: UserStatus;
    is_active: boolean;
    email_verified_at?: string;
    last_login_at?: string;
    created_at: string;
  }

  interface UserSession {
    loggedInAt?: string;
    provider?: "email" | "github" | "google" | "facebook";
  }
}

export { User, UserSession };
