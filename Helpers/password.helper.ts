import { bcrypt } from "../Dependencies/dependencias.ts";

const SALT_ROUNDS = 10;

export async function hashPassword(passwordPlano: string): Promise<string> {
  return await bcrypt.hash(passwordPlano, SALT_ROUNDS);
}

export async function compararPassword(
  passwordPlano: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(passwordPlano, hash);
}