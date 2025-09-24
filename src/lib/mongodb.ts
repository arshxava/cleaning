// // import { MongoClient } from 'mongodb';

// // if (!process.env.MONGODB_URI) {
// //   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
// // }

// // const uri = process.env.MONGODB_URI;
// // const options = {};

// // let client: MongoClient;
// // let clientPromise: Promise<MongoClient>;

// // if (process.env.NODE_ENV === 'development') {
// //   // In development mode, use a global variable so that the value
// //   // is preserved across module reloads caused by HMR (Hot Module Replacement).
// //   let globalWithMongo = global as typeof globalThis & {
// //     _mongoClientPromise?: Promise<MongoClient>
// //   }
  
// //   if (!globalWithMongo._mongoClientPromise) {
// //     client = new MongoClient(uri, options);
// //     globalWithMongo._mongoClientPromise = client.connect();
// //     console.log("Attempting to connect to MongoDB in development...");
// //   }
// //   clientPromise = globalWithMongo._mongoClientPromise;
// // } else {
// //   // In production mode, it's best to not use a global variable.
// //   client = new MongoClient(uri, options);
// //   clientPromise = client.connect();
// //   console.log("Attempting to connect to MongoDB in production...");
// // }

// // // Log connection status with detailed error handling
// // clientPromise.then(() => {
// //   console.log("✅ Successfully connected to MongoDB.");
// // }).catch(err => {
// //   console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
// //   console.error("!!! FAILED TO CONNECT TO MONGODB ATLAS - SERVER WILL NOT WORK !!!");
// //   console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
// //   console.error("\nThis is a critical error, likely due to a network or configuration issue.");
// //   console.error("Here is the raw error from the driver:", err);
  
// //   console.error("\n\n--- ACTION REQUIRED: DEBUGGING CHECKLIST ---");
// //   console.error("\n1. CHECK MONGODB ATLAS IP ACCESS LIST:");
// //   console.error("   The most common cause of this error is that your server's IP address is not whitelisted.");
// //   console.error("   Your server's public IP appears to be `134.122.36.92` (based on logs).");
// //   console.error("   Go to your MongoDB Atlas dashboard -> Network Access -> Add IP Address.");
// //   console.error("   Add `134.122.36.92/32` to the list. For a quick test, you can add `0.0.0.0/0` (Allow Access From Anywhere), but this is not recommended for production.");

// //   console.error("\n2. VERIFY MONGODB_URI IN YOUR `.env` FILE:");
// //   console.error("   - Double-check the username and password.");
// //   console.error("   - Ensure the cluster address is correct.");
// //   console.error("   - Make sure there are no special characters in the password that need to be URL-encoded.");

// //   console.error("\n3. CHECK FIREWALLS:");
// //   console.error("   - Ensure your server's firewall is not blocking outbound traffic on port 27017.");
  
// //   console.error("\n-----------------------------------------------\n");
// // });


// // export default clientPromise;

// // lib/mongodb.ts
// import { MongoClient } from "mongodb";

// const uri = process.env.MONGODB_URI as string;
// if (!uri) {
//   throw new Error("⚠️ Please add your MongoDB URI to .env as MONGODB_URI");
// }

// let client: MongoClient;
// let clientPromise: Promise<MongoClient>;

// // Reuse the MongoClient across hot reloads in dev
// if (process.env.NODE_ENV === "development") {
//   if (!(global as any)._mongoClientPromise) {
//     client = new MongoClient(uri);
//     (global as any)._mongoClientPromise = client.connect();
//   }
//   clientPromise = (global as any)._mongoClientPromise;
// } else {
//   client = new MongoClient(uri);
//   clientPromise = client.connect();
// }

// export default clientPromise;



// File 1: lib/mongodb.ts
import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const uri = process.env.MONGODB_URI;

// Add specific MongoDB connection options to handle network issues
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  retryWrites: true,
  w: "majority",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;