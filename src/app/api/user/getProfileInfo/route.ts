// src/app/api/user/getProfileInfo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function POST(req: NextRequest) {
    try {
        // セッション認証関数
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // ユーザーとプロフィールをまとめて取得
        const userWithProfile = await UserRepository.findUserWithProfileByUID(uid);
        if (!userWithProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { display_name, age, residence, occupation, message } = userWithProfile;

        return NextResponse.json({
            profile: { display_name, age, residence, occupation, message },
        });
    } catch (err: any) {
        console.error('getProfileById Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}