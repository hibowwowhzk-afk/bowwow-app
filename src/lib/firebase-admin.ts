// lib/firebase-admin.ts

// サーバー側でFirebase Admin SDKを初期化し、管理者権限で操作するための設定
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
// Firebase Admin SDKの初期化
const adminApp = !getApps().length ? initializeApp() : getApp();
// 管理者権限の認証インスタンスをエクスポート
export const adminAuth = getAuth(adminApp);