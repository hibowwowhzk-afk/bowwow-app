// src/app/api/matchings/[matchId]/feedback/route.ts

import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchFeedbackRepository } from '@/repositories/MatchFeedbackRepository';

export async function POST(req: Request) {
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
                { error: 'ユーザーが見つかりません' },
                { status: 404 }
            );
        }

        const userId = user.user_id;

        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchId = Number(pathSegments[pathSegments.length - 2]);

        const body = await req.json();
        const { result } = body;

        if (!['met', 'not_met'].includes(result)) {
            return NextResponse.json(
                { error: '不正な値です' },
                { status: 400 }
            );
        }

        await MatchFeedbackRepository.insert(
            matchId,
            userId,
            result
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}