// Firebase v12.13.0 - CJP
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2VoBxsKWTTStFkE_XQzAnyyeyDtn9g8M",
  authDomain: "cjpproducts8825.firebaseapp.com",
  projectId: "cjpproducts8825",
  storageBucket: "cjpproducts8825.firebasestorage.app",
  messagingSenderId: "381074298280",
  appId: "1:381074298280:web:f736eab562dc6cb2f0f99d",
  measurementId: "G-RWNLP0LYP4"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const ADMIN_EMAILS = ["priyam.dgp13@gmail.com", "polarithweb@gmail.com"];
export const WHATSAPP_NUMBER = "918345890843";
