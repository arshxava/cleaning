import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // The service account is expected to be in a JSON file in the root directory
    // This is the standard way when deploying to many services.
    const serviceAccount = require('../../firebaseServiceAccount.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase admin initialized successfully from JSON file.');
  } catch (error: any) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! FIREBASE ADMIN INITIALIZATION FAILED - SERVER MAY NOT WORK !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error("\n--- ACTION REQUIRED: `firebaseServiceAccount.json` NOT FOUND ---");
        console.error("The application is configured to load Firebase credentials from a file named `firebaseServiceAccount.json` in the project's root directory, but this file could not be found.");
        console.error("1. Go to your Firebase project settings -> 'Service accounts' tab.");
        console.error("2. Click 'Generate new private key' and download the JSON file.");
        console.error("3. Rename the downloaded file to `firebaseServiceAccount.json`.");
        console.error("4. Place this file in the root directory of your project (the same level as `package.json`).");
    } else {
        console.error("\n--- ACTION REQUIRED: FAILED TO PARSE `firebaseServiceAccount.json` ---");
        console.error("An error occurred while trying to initialize Firebase. This could be due to a malformed JSON file or incorrect permissions.");
        console.error("Here is the raw error:", error);
    }
     console.error("\n----------------------------------------------------------------\n");
  }
}

export default admin;
