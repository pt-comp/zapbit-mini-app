// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBe2Q0MwsDAmuIdK7yE5GQ3U0S0-Eo_C18",
  authDomain: "zapbit-mini-app.firebaseapp.com",
  projectId: "zapbit-mini-app",
  storageBucket: "zapbit-mini-app.appspot.com",
  messagingSenderId: "860528995101",
  appId: "1:860528995101:web:699f4a2fc12398ffdcde3e4",
  measurementId: "G-4ARR4CG9Z7",
  databaseURL: "https://zapbit-mini-app-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { db, doc, setDoc, getDoc, updateDoc, arrayUnion, realtimeDb, ref, onValue, set };