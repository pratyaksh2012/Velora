import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBfEBi-HtlpkB7Qr4jORW_fKJUv5zYbNow",
    authDomain: "velora-d5c97.firebaseapp.com",
    projectId: "velora-d5c97",
    storageBucket: "velora-d5c97.firebasestorage.app",
    messagingSenderId: "688991165291",
    appId: "1:688991165291:web:1c819179f476b8c1374a2e",
    measurementId: "G-34E4D7XHDQ"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);