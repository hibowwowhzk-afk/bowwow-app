// lib/firebase.ts

// Firebase を初期化し、ユーザーの認証状態を取得
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp | undefined;

    if (typeof window !== 'undefined') {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export const auth: Auth | null = app ? getAuth(app) : null;

// useAuth フックを提供
export const useAuth = () => {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized');
    }
    return useAuthState(auth);
};

// ID トークン取得用
export async function getIdToken(): Promise<string | null> {
    if (!auth) {
        console.warn('Firebase Auth is not initialized.');
        return null;
    }
    const user = auth.currentUser;
    if (user) {
        try {
        return await user.getIdToken();
        } catch (err) {
        console.error('Failed to get ID token:', err);
        return null;
        }
    }
    return null;
}