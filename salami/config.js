import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAH5NrTOu9uT9_WMBlBhJS4Dqd-qkPEYs8",
    authDomain: "general-57884.firebaseapp.com",
    databaseURL: "https://general-57884-default-rtdb.firebaseio.com",
    projectId: "general-57884",
    storageBucket: "general-57884.firebasestorage.app",
    messagingSenderId: "5002724584",
    appId: "1:5002724584:web:80fde1ae04c6276eb9b55d",
    measurementId: "G-0YNBLT8CD2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "salami-portal-final";

// --- AI (MISTRAL) CONFIGURATION ---
export const AI_API_KEY = "8Ykc79Mnq5DsXd70FQG2FHsaeiByB8xv";
export const AI_MODEL = "pixtral-large-latest"; // Mistral Best Vision Model

// --- PROFANITY DICTIONARY ---
export const BAD_WORDS = ['শালা', 'বাল', 'মাগি', 'খানকি', 'চুদ', 'চুদা', 'কুত্তা', 'শুয়োর', 'বেশ্যা', 'হালারপো', 'fuck', 'bitch', 'asshole', 'bastard'];
