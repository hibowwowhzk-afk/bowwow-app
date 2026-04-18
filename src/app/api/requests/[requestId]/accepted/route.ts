// src/app/api/requests/[requestId]/accepted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { RequestRepository } from '@/repositories/RequestRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

export async function POST(req: NextRequest) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');

        // URL例: /api/requests/123/accepted
        const requestIdStr = pathSegments[pathSegments.length - 2]; // requestId
        const requestId = Number(requestIdStr);
        if (!requestId || isNaN(requestId)) {
            return NextResponse.json({ error: '不正な requestId です' }, { status: 400 });
        }

        const body = await req.json();
        const matchMessage: string | null = body.match_message ?? null;

        // リクエストステータス更新
        await RequestRepository.updateRequestStatus(requestId, 'accepted');

        // 承認の場合のみマッチ作成
        const request = await RequestRepository.getRequestById(requestId);
        await MatchesRepository.insertMatch({
            request_id: request.id,
            post_id: request.post_id,
            from_user_id: request.to_user_id,
            to_user_id: request.from_user_id,
            match_message: matchMessage,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('処理中にエラー:', err);
        return NextResponse.json({ error: 'リクエスト処理に失敗しました' }, { status: 500 });
    }
}
