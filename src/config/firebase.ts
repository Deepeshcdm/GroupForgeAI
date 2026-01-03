// Firebase configuration for GroupForge AI
// Replace these values with your actual Firebase project credentials

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required Firebase env vars
const requiredEnvVars = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];
const missingVars = requiredEnvVars.filter(
    key => !import.meta.env[key]?.toString().trim()
);

if (missingVars.length > 0) {
    console.warn(`Missing Firebase environment variables: ${missingVars.join(', ')}. Firebase features will be disabled.`);
}

// Initialize Firebase only if required config is present
const app = firebaseConfig.apiKey?.toString().trim() && firebaseConfig.projectId?.toString().trim()
    ? initializeApp(firebaseConfig)
    : null;

// Initialize services with null checks
export const auth = app ? getAuth(app) : (null as any);
export const db = app ? getFirestore(app) : (null as any);
export const storage = app ? getStorage(app) : (null as any);
export const functions = app ? getFunctions(app) : (null as any);

// Auth providers - only create if app exists
export const googleProvider = app ? new GoogleAuthProvider() : (null as any);
export const githubProvider = app ? new GithubAuthProvider() : (null as any);

export default app;
