import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBF4Nsst7Vm0n0s1PQR-jMDoDzhi1siFFs",
  authDomain: "tartb-e4608.firebaseapp.com",
  projectId: "tartb-e4608",
  storageBucket: "tartb-e4608.firebasestorage.app",
  messagingSenderId: "778742360621",
  appId: "1:778742360621:web:2c1c6436cfec1b6270e6a4",
  measurementId: "G-4PQ98N4VDE",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Enable offline persistence for local-first architecture
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn("Firestore persistence failed: multiple tabs open");
  } else if (err.code === "unimplemented") {
    // Browser doesn't support persistence
    console.warn("Firestore persistence not supported in this browser");
  }
});

// Initialize Auth
export const auth = getAuth(app);
