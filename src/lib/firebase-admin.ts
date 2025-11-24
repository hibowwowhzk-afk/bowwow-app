// lib/firebase-admin.ts

import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;

const adminApp = !getApps().length
    ? initializeApp(
          serviceAccount
              ? { credential: cert(serviceAccount) }
              : undefined
      )
    : getApp();

export const adminAuth = getAuth(adminApp);
