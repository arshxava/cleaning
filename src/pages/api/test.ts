// // pages/api/test.ts
// import type { NextApiRequest, NextApiResponse } from "next";
// import clientPromise from "../../lib/mongodb";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     const client = await clientPromise;
//     const db = client.db(process.env.MONGODB_DB_NAME || "defaultDbName");

//     const users = await db.collection("users").find({}).toArray();

//     res.status(200).json({ users });
//   } catch (err) {
//     console.error("API ERROR:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }
// File 3: pages/api/test-connection.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    
    // Test the connection
    await client.db("admin").command({ ping: 1 });
    
    const db = client.db(process.env.MONGODB_DB_NAME || "test");
    const collections = await db.listCollections().toArray();

    res.status(200).json({
      success: true,
      message: "Connected to MongoDB successfully",
      database: process.env.MONGODB_DB_NAME || "test",
      collections: collections.map(c => c.name),
    });
  } catch (error: any) {
    console.error("MongoDB connection error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: "Check your MONGODB_URI and network access settings",
    });
  }
}