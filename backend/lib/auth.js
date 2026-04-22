import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "nyayasetu_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

function getSessionSecret() {
  const value = process.env.SESSION_SECRET || (process.env.NODE_ENV !== "production" ? "nyayasetu-dev-session-secret" : "");
  if (!value) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return encoder.encode(value);
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token) {
  try {
    const result = await jwtVerify(token, getSessionSecret());
    return result.payload;
  } catch {
    return null;
  }
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { _id, email, name, avatar, bio, emojiPack, themeColor, createdAt } = user;

  return {
    id: _id.toString(),
    email,
    name,
    avatar: avatar || "⚖️",
    bio: bio || "",
    emojiPack: Array.isArray(emojiPack) ? emojiPack : ["⚖️", "🧠", "📜", "🛡️"],
    themeColor: themeColor || "#e8762d",
    createdAt: createdAt ? new Date(createdAt).toISOString() : null,
  };
}

export function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8;
}
