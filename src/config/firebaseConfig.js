// src/config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDOqD4A875qg4uRLw17mAXn93IIZIJlsc0",
  authDomain: "wedding-invitation-c9c05.firebaseapp.com",
  databaseURL: "https://wedding-invitation-c9c05-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wedding-invitation-c9c05",
  storageBucket: "wedding-invitation-c9c05.firebasestorage.app",
  messagingSenderId: "213222123973",
  appId: "1:213222123973:web:e0f7d9d60e449a323703ac",
  measurementId: "G-V617936D5L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { db }; // Named export