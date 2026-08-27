import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";
import { getAI, GoogleAIBackend } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// App Check must be initialized before any other Firebase service is used.
if (import.meta.env.DEV) {
  // In dev, use a debug token instead of real reCAPTCHA (register it once in
  // Firebase Console → App Check → Manage debug tokens).
  const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  (
    self as typeof self & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }
  ).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
}

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
// In dev the debug token above bypasses reCAPTCHA entirely, so App Check can
// initialize even before a real site key exists. In production a real key is required.
if (recaptchaSiteKey || import.meta.env.DEV) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey || "debug-placeholder"),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);

// Offline persistence lets the app keep working without a connection and sync once back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({}),
  }),
});

// Gemini Developer API backend — free tier, key never leaves Firebase's proxy.
export const ai = getAI(app, { backend: new GoogleAIBackend() });
