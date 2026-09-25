import { cookies } from 'next/headers';
import { env } from '@/app/database';

const COOKIE = 'siratsi_session';
const DAYS = 7;
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes)).map((x) => x.toString(16).padStart(2, '0')).join('');
const digest = async (value: string) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));

export function validPassword(password: string) { return password.length >= 12 && password.length <= 128; }
export async function hashPassword(password: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/.{2}/g)!.map((x) => parseInt(x, 16))), iterations: 310000, hash: 'SHA-256' }, key, 256);
  return `${salt}:${hex(bytes)}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{64}$/.test(expected || '')) return false;
  const actual = (await hashPassword(password, salt)).split(':')[1];
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}
export async function passwordSessionUserId() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await env.DB!.prepare('SELECT user_id AS userId FROM password_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(token), new Date().toISOString()).first<{ userId: string }>();
  return row?.userId || null;
}
export async function issueSession(userId: string) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const now = new Date();
  await env.DB!.prepare('INSERT INTO password_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').bind(await digest(token), userId, new Date(now.getTime() + DAYS * 86400000).toISOString(), now.toISOString()).run();
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: DAYS * 86400 });
}
export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) await env.DB!.prepare('DELETE FROM password_sessions WHERE token_hash = ?').bind(await digest(token)).run();
  jar.delete(COOKIE);
}
