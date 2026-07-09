import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBe4jotsFwwtmiqz80RSFAExXztXAUCoTk",
  authDomain: "yeah-buddy-app.firebaseapp.com",
  projectId: "yeah-buddy-app",
  storageBucket: "yeah-buddy-app.firebasestorage.app",
  messagingSenderId: "409912443715",
  appId: "1:409912443715:web:ab503e9d289e60ae5ae5f6"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Local dev only: point at the Firebase emulators instead of production when
// VITE_USE_FIREBASE_EMULATOR=true, so UI testing never touches real user data.
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
