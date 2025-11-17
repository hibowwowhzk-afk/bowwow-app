import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RequestRepository } from '@/repositories/RequestRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

const ActionSchema = z.enum(['accepted', 'rejected']);

export async function POST(req: NextRequest, context: { params: { requestId: string; action: string } }) {
    const requestId = Number(context.params.requestId);
    const action = context.params.action;

    if (!requestId || isNaN(requestId)) {
        return NextResponse.json({ error: '不正な requestId です' }, { status: 400 });
    }

    if (!ActionSchema.safeParse(action).success) {
        return NextResponse.json({ error: '不正なアクションです' }, { status: 400 });
    }

    const body = await req.json();
    const matchMessage: string | null = body.match_message ?? null;

    try {
        await RequestRepository.updateRequestStatus(requestId, action as 'accepted' | 'rejected');

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
