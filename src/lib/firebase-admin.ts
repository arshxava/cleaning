import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // The service account credentials should be set as environment variables in your hosting environment
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default admin;
