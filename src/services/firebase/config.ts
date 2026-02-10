import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
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

// Initialize Firestore with offline persistence and multi-tab support
// This enables local-first architecture: all operations work offline and sync when online
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Auth
export const auth = getAuth(app);
