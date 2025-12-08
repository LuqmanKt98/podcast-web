// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: "podcast-database-3c8ad.firebaseapp.com",
  projectId: "podcast-database-3c8ad",
  storageBucket: "podcast-database-3c8ad.firebasestorage.app",
  messagingSenderId: "912748695210",
  appId: "1:912748695210:web:376a8a786eaae6fb370ad3",
  measurementId: "G-R8GF251W72"
};

// Initialize Firebase (singleton pattern to avoid multiple initializations)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, db };

