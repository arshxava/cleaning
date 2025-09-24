import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    console.log("Attempting to connect to MongoDB in development...");
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  console.log("Attempting to connect to MongoDB in production...");
}

// Log connection status
clientPromise.then(() => {
  console.log("Successfully connected to MongoDB.");
}).catch(err => {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("!!! FAILED TO CONNECT TO MONGODB ATLAS !!!");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("Error details:", err);
  console.error("\nPotential Fixes:");
  console.error("1. Check if the MONGODB_URI in your .env file is correct.");
  console.error("2. Ensure your server's IP address is whitelisted in MongoDB Atlas under 'Network Access'. The current server IP might not be allowed to connect.");
  console.error("3. Verify that there are no firewall rules blocking outbound traffic on port 27017.");
});


export default clientPromise;
