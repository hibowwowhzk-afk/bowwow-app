// src/app/api/loginSession/route.js

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'IDトークンがありません' },
                { status: 400 }
            );
        }

        await adminAuth.verifyIdToken(idToken);

        const expiresIn = 60 * 60 * 1000;

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn,
        });

        const cookieStore = cookies();

        (cookieStore as any).set('session', sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'strict',
            maxAge: expiresIn / 1000,
        });

        return NextResponse.json({ message: 'セッション開始' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}