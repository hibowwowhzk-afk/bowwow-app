// src/app/api/requests/getRequestCount/route.ts

import { NextResponse } from 'next/server';
import { RequestRepository } from '@/repositories/RequestRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

const REQUEST_LIMIT = 5;

export async function GET() {
    try {
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        const userId = user.user_id;

        const count = await RequestRepository.countPendingByFromUserId(userId);

        return NextResponse.json({
            count,
            limit: REQUEST_LIMIT,
            remaining: Math.max(REQUEST_LIMIT - count, 0),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'データ取得に失敗しました' },
            { status: 500 }
        );
    }
}