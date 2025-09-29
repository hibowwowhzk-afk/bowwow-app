// /app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { UserActivityRepository } from '@/repositories/UserActivityRepository';

export async function GET(req: NextRequest) {
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

        const activity = await UserActivityRepository.findByUserId(user.user_id);
        const lastCheckedRequests = activity?.last_checked_requests_at ?? new Date(0);
        const lastCheckedAccepted = activity?.last_checked_accepted_at ?? new Date(0);

        // 未読リクエスト・承諾通知取得
        const incoming = await RequestRepository.getUnreadIncomingRequests(user.user_id, lastCheckedRequests);
        const accepted = await RequestRepository.getUnreadAcceptedRequests(user.user_id, lastCheckedAccepted);

        return NextResponse.json({
            pendingRequests: incoming,
            acceptedRequests: accepted,
        });
    } catch (error) {
        return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
    }
}