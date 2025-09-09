import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'campus-clean-jhzd4',
  appId: '1:984880250633:web:43e0f5e7f17ba60a0e1dd8',
  storageBucket: 'campus-clean-jhzd4.firebasestorage.app',
  apiKey: 'AIzaSyCkpxOB9a5Cg5oH02jkJ2t8uIsu7FVrv2E',
  authDomain: 'campus-clean-jhzd4.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '984880250633',
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

export { app, auth };
