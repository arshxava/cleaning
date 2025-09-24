// pages/api/test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "defaultDbName");

    const users = await db.collection("users").find({}).toArray();

    res.status(200).json({ users });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
