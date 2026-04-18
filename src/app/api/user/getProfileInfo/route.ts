// src/app/api/user/getProfileInfo/route.ts

import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function POST() {
    try {
        /* ------------------------------
         * 1. セッション認証
         * ------------------------------ */
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }
        const uid = authResult.uid;

        /* ------------------------------
         * 2. user_id 取得
         * ------------------------------ */
        const user = await UserRepository.findUserByUID(uid);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        /* ------------------------------
         * 3. プロフィール + 画像取得
         * ------------------------------ */
        const profile = await UserRepository.getProfileById(user.user_id);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            profile: {
                display_name: profile.display_name,
                age: profile.age,
                residence: profile.residence,
                occupation: profile.occupation,
                message: profile.message,
                image_url: profile.image_url,
            },
        });
    } catch (err) {
        console.error('getProfileInfo Error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
