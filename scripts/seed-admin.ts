/**
 * To run this script:
 * 1. Make sure you have ts-node installed: npm install -g ts-node
 * 2. Set your MONGODB_URI in a .env file in the root directory.
 * 3. Run: ts-node --require dotenv/config scripts/seed-admin.ts
 */
import { MongoClient } from 'mongodb';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// --- Configuration ---
const adminConfig = {
  email: 'admincleaning123@gmail.com',
  password: '098admin',
  name: 'Admin User',
  phone: '0000000000',
  notificationPreference: 'email',
  school: 'N/A',
  roomSize: 'N/A',
  role: 'admin' as const,
};

const firebaseConfig = {
    // IMPORTANT: Replace with your actual Firebase config
    projectId: 'campus-clean-jhzd4',
    appId: '1:984880250633:web:43e0f5e7f17ba60a0e1dd8',
    storageBucket: 'campus-clean-jhzd4.firebasestorage.app',
    apiKey: 'AIzaSyCkpxOB9a5Cg5oH02jkJ2t8uIsu7FVrv2E',
    authDomain: 'campus-clean-jhzd4.firebaseapp.com',
    measurementId: '',
    messagingSenderId: '984880250633',
};
// --------------------


async function main() {
  console.log('Starting admin user seeding process...');

  // --- Initialize Firebase Admin ---
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let uid = '';

  try {
    // --- 1. Create user in Firebase Auth ---
    console.log(`Attempting to create Firebase user for ${adminConfig.email}...`);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminConfig.email,
      adminConfig.password
    );
    uid = userCredential.user.uid;
    console.log(`Successfully created Firebase user with UID: ${uid}`);

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.warn(`Firebase user with email ${adminConfig.email} already exists.`);
      // We need to get the UID of the existing user to proceed
      // This part is tricky with the client SDK without signing in.
      // For a seeding script, it's often easier to delete the user and recreate.
      // Or handle this manually. For now, we will stop if the user exists.
      console.error('Please delete the existing user from Firebase Authentication and MongoDB to re-run this script.');
      process.exit(1);
    } else {
      console.error('Error creating Firebase user:', error);
      process.exit(1);
    }
  }


  // --- 2. Save user data to MongoDB ---
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in your .env file');
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB.');

    const db = client.db(); // Use default DB from connection string
    const usersCollection = db.collection('users');

    const adminData = {
      uid: uid,
      ...adminConfig,
      createdAt: new Date(),
    };
    
    // Use updateOne with upsert to avoid duplicate errors on re-run
    const result = await usersCollection.updateOne(
        { uid: uid },
        { $set: adminData },
        { upsert: true }
    );

    if (result.upsertedCount > 0) {
        console.log(`Successfully inserted new admin user into MongoDB with ID: ${result.upsertedId}`);
    } else if (result.matchedCount > 0) {
        console.log(`Successfully updated existing admin user in MongoDB with UID: ${uid}`);
    }


  } catch (err) {
    console.error('Error connecting to or writing to MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }

  console.log('Admin seeding process finished.');
  process.exit(0);
}

main().catch(console.error);
