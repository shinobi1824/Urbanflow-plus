import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { UserPreferences } from "../types";

// Configuración oficial Web App (urbanflow-plus-db62f)
const firebaseConfig = {
  apiKey: "AIzaSyBAhHZ-YKikYgqjbbFzm900Vi3XMzjw2kI",
  authDomain: "urbanflow-plus-db62f.firebaseapp.com",
  projectId: "urbanflow-plus-db62f",
  storageBucket: "urbanflow-plus-db62f.firebasestorage.app",
  messagingSenderId: "367785203370",
  appId: "1:367785203370:web:aa0eb5b5b18f593056e2d3",
  measurementId: "G-TJPCCBHYH4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializar Analytics de manera segura (asíncrona)
export let analytics: any = null;

try {
  isSupported().then((supported: boolean) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((e: any) => {
    console.warn("Analytics not supported in this environment:", e);
  });
} catch (e) {
  console.warn("Firebase Analytics init error:", e);
}

// Helpers para Base de Datos
export const FirebaseService = {
  // Crear o actualizar perfil de usuario en Firestore
  syncUserProfile: async (user: User, additionalData?: Partial<UserPreferences>) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Si existe, devolver datos combinados
        return userSnap.data() as UserPreferences;
      } else {
        // Si es nuevo, crear documento inicial
        const initialProfile = {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          isPremium: false,
          points: 0,
          level: 1,
          createdAt: new Date().toISOString(),
          ...additionalData
        };
        await setDoc(userRef, initialProfile);
        return initialProfile;
      }
    } catch (error) {
      console.error("Error syncing profile:", error);
      // Fallback local si falla la conexión a BD o permisos
      return {
        email: user.email || '',
        name: user.email?.split('@')[0],
        isPremium: false,
        points: 0,
        level: 1,
        favorites: [],
        theme: 'dark',
        language: 'es'
      } as any;
    }
  },

  // Actualizar estado Premium
  upgradeToPremium: async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { isPremium: true });
    } catch (e) {
      console.error("Error upgrading premium:", e);
    }
  },

  // Obtener puntos y estadísticas
  getUserStats: async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      return null;
    }
  }
};