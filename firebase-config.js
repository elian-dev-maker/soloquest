import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxEh6iehpGHYn2AD6vXO11v4iPK1mn1gU",
  authDomain: "soloquest-a7058.firebaseapp.com",
  projectId: "soloquest-a7058",
  storageBucket: "soloquest-a7058.firebasestorage.app",
  messagingSenderId: "76465072797",
  appId: "1:76465072797:web:69a2d04965ecb34a4b0274"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);