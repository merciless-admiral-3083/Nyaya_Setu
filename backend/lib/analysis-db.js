import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb";

function normalizeAnalysis(document) {
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

export async function storeAnalysisRecord(record) {
  const db = await getDatabase();
  if (!db) {
    return null;
  }

  const collection = db.collection("analyses");
  const now = new Date();
  const document = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);
  return normalizeAnalysis({ ...document, _id: result.insertedId });
}

export async function getLatestAnalysisRecord() {
  const db = await getDatabase();
  if (!db) {
    return null;
  }

  const collection = db.collection("analyses");
  const document = await collection.findOne({}, { sort: { createdAt: -1, _id: -1 } });
  return normalizeAnalysis(document);
}

export async function getLatestAnalysisForUser(userId) {
  const db = await getDatabase();
  if (!db || !ObjectId.isValid(userId)) {
    return null;
  }

  const collection = db.collection("analyses");
  const document = await collection.findOne(
    { userId },
    { sort: { createdAt: -1, _id: -1 } }
  );

  return normalizeAnalysis(document);
}

export async function getAnalysesForUser(userId, limit = 20) {
  const db = await getDatabase();
  if (!db || !ObjectId.isValid(userId)) {
    return [];
  }

  const collection = db.collection("analyses");
  const docs = await collection
    .find({ userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  return docs.map((item) => normalizeAnalysis(item));
}
