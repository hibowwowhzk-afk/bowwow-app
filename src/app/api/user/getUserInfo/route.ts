// src/app/api/user/getUserInfo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/userRepository';
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

        // フロントに返す用に整形
        const safeUser = {
            user_id: userWithProfile.user_id,
            authority: userWithProfile.authority,
        };

        const safeProfile = {
            is_profile_completed: userWithProfile.is_profile_completed,
            display_name: userWithProfile.display_name,
        };

        return NextResponse.json({
            user: safeUser,
            profile: safeProfile,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}