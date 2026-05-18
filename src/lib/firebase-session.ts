// lib/firebase-session.ts
import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

export async function verifySessionFromRequest() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return { error: '未認証（セッションなし）', status: 401 };
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return { uid: decodedToken.uid };
    } catch {
        return { error: 'セッション検証に失敗しました', status: 401 };
    }
}