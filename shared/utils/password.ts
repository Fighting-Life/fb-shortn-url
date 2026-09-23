import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function generateHashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return compare(password, hashed);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8)
    return { valid: false, message: "Password minimal 8 karakter" };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: "Password harus ada huruf kapital" };
  if (!/[0-9]/.test(password))
    return { valid: false, message: "Password harus ada angka" };
  return { valid: true };
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export const generateRandomPassword = () => {
  return Math.random().toString(36).substring(2, 10);
};
