import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";
import { sanitizeUser } from "./auth";

function normalizeDocument(document) {
  if (!document) {
    return null;
  }

  const { _id, createdAt, updatedAt, ...rest } = document;
  return {
    ...rest,
    _id: _id ? _id.toString() : undefined,
    createdAt: createdAt ? new Date(createdAt).toISOString() : null,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
  };
}

async function getUsersCollection() {
  const db = await getDatabase();
  if (!db) {
    return null;
  }

  const collection = db.collection("users");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
}

export async function createUser({ email, name, passwordHash }) {
  const collection = await getUsersCollection();
  if (!collection) {
    return null;
  }

  const now = new Date();
  const document = {
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    avatar: "⚖️",
    bio: "",
    emojiPack: ["⚖️", "🧠", "📜", "🛡️"],
    themeColor: "#e8762d",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function findUserByEmail(email) {
  const collection = await getUsersCollection();
  if (!collection) {
    return null;
  }

  return collection.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserById(userId) {
  const collection = await getUsersCollection();
  if (!collection) {
    return null;
  }

  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return collection.findOne({ _id: new ObjectId(userId) });
}

export async function updateUserProfile(userId, updates) {
  const collection = await getUsersCollection();
  if (!collection || !ObjectId.isValid(userId)) {
    return null;
  }

  const allowed = {
    name: typeof updates?.name === "string" ? updates.name.trim() : undefined,
    avatar: typeof updates?.avatar === "string" ? updates.avatar.trim().slice(0, 8) : undefined,
    bio: typeof updates?.bio === "string" ? updates.bio.slice(0, 240) : undefined,
    themeColor: typeof updates?.themeColor === "string" ? updates.themeColor : undefined,
    emojiPack: Array.isArray(updates?.emojiPack) ? updates.emojiPack.slice(0, 6) : undefined,
  };

  const payload = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  if (Object.keys(payload).length === 0) {
    const current = await findUserById(userId);
    return current ? sanitizeUser(current) : null;
  }

  payload.updatedAt = new Date();

  await collection.updateOne({ _id: new ObjectId(userId) }, { $set: payload });
  const updated = await collection.findOne({ _id: new ObjectId(userId) });
  return updated ? sanitizeUser(updated) : null;
}

export function normalizeUser(document) {
  return sanitizeUser(document);
}

export function normalizeGenericDocument(document) {
  return normalizeDocument(document);
}
