import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
