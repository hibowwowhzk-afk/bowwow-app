// src/app/api/requests/getMatchedRequests/route.ts

import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // 自身のプロフィール取得
        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            throw new Error('ユーザー情報が見つかりません');
        }

        // 自身のリクエスト情報取得
        const rows = await RequestRepository.getMatchedRequestsByUserId(user.user_id);

        return NextResponse.json({ matchedRequestsList: rows });
    } catch (error) {
        return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }
}