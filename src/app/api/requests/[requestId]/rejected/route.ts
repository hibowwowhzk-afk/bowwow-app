// src/app/api/matchings/[requestId]/rejected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { RequestRepository } from '@/repositories/RequestRepository';

export async function POST(req: NextRequest) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // requestId 取得
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const requestIdStr = pathSegments[pathSegments.length - 2]; // requestId
        const requestId = Number(requestIdStr);
        if (!requestId || isNaN(requestId)) {
            return NextResponse.json({ error: '不正な requestId です' }, { status: 400 });
        }

        // ステータスを rejected に更新
        await RequestRepository.updateRequestStatus(requestId, 'rejected');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('拒否処理中にエラー:', err);
        return NextResponse.json({ error: 'リクエスト拒否に失敗しました' }, { status: 500 });
    }
}
