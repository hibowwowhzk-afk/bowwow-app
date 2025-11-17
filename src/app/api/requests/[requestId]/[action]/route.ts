// src/app/api/requests/[requestId]/[action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RequestRepository } from '@/repositories/RequestRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

const ActionSchema = z.enum(['accepted', 'rejected']);

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');

        // URL例: /api/requests/123/accepted
        const requestIdStr = pathSegments[pathSegments.length - 2]; // requestId
        const action = pathSegments[pathSegments.length - 1]; // action
        const requestId = Number(requestIdStr);
        if (!requestId || isNaN(requestId)) {
            return NextResponse.json({ error: '不正な requestId です' }, { status: 400 });
        }

        if (!ActionSchema.safeParse(action).success) {
            return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
        }

        const body = await req.json();
        const matchMessage: string | null = body.match_message ?? null;

        // リクエストステータス更新
        await RequestRepository.updateRequestStatus(requestId, action as 'accepted' | 'rejected');

        // 承認の場合のみマッチ作成
        if (action === 'accepted') {
            const request = await RequestRepository.getRequestById(requestId);

            await MatchesRepository.insertMatch({
                request_id: request.id,
                post_id: request.post_id,
                from_user_id: request.to_user_id,
                to_user_id: request.from_user_id,
                match_message: matchMessage,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('処理中にエラー:', err);
        return NextResponse.json({ error: 'リクエスト処理に失敗しました' }, { status: 500 });
    }
}
