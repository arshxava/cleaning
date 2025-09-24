import admin from 'firebase-admin';
import serviceAccount from '../../firebaseServiceAccount.json'; 
if (!admin.apps.length) {
  try {
    // Initialize Firebase admin using the JSON
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('Firebase admin initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default admin;
