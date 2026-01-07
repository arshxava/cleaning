import admin from './src/lib/firebase-admin'; 
// 👆 adjust path if your firebase admin file is elsewhere

(async () => {
  try {
    await admin.auth().listUsers(1);
    console.log('🔥 Firebase Admin WORKING');
    process.exit(0);
  } catch (err) {
    console.error('❌ Firebase Admin FAILED');
  
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
  
    process.exit(1);
  }  
})();
