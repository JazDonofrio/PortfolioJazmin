import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";

// Token de sesión derivado de la contraseña (simple pero suficiente para un
// panel personal). Cambiar ADMIN_PASSWORD invalida las sesiones anteriores.
export function sessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD || "cambiame123";
  // Codificación básica; no reversible a simple vista.
  return Buffer.from(`jazmin:${secret}`).toString("base64url");
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "cambiame123";
  return password === expected;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === sessionToken();
}
