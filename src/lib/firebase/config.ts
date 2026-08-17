import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0825109257",
  appId: "1:75034073947:web:388e2a992c7616ec6d987e",
  apiKey: "AIzaSyC1LEVX_pFTax1eQaZuv4BqFhxcS02hddc",
  authDomain: "gen-lang-client-0825109257.firebaseapp.com",
  storageBucket: "gen-lang-client-0825109257.firebasestorage.app",
  messagingSenderId: "75034073947"
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-wnelai-d3d08bdc-23dc-46fa-b438-079898450f2f");
export const auth = getAuth(app);
