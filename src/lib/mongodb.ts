import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is missing or invalid.');
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

console.log('MongoDB URI:', uri); // Log MongoDB URI to ensure it's correct (be careful not to log sensitive info in production)

// Check the environment and log the relevant info
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode: Using global variable for MongoClient');

  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  
  if (!globalWithMongo._mongoClientPromise) {
    console.log('MongoClient instance not found in global variable. Creating new client...');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  } else {
    console.log('MongoClient instance found in global variable. Reusing existing client...');
  }

  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  console.log('Running in production mode: Creating new MongoClient instance without global variable.');

  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Log that client promise is being returned
console.log('MongoClient promise created. Waiting for connection...');
export default clientPromise;
