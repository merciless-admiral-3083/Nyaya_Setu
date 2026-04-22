import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "nyayasetu";

const globalForMongo = globalThis;

function getClientPromise() {
  if (!uri) {
    return null;
  }

  if (!globalForMongo.__nyayasetuMongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.__nyayasetuMongoClientPromise = client.connect().catch((error) => {
      // Reset cached promise so later requests can retry connection.
      globalForMongo.__nyayasetuMongoClientPromise = undefined;
      console.error("MongoDB connection failed:", error);
      return null;
    });
  }

  return globalForMongo.__nyayasetuMongoClientPromise;
}

export async function getDatabase() {
  const clientPromise = getClientPromise();
  if (!clientPromise) {
    return null;
  }

  const client = await clientPromise;
  if (!client) {
    return null;
  }

  return client.db(dbName);
}