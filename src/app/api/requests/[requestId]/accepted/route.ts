// src/app/api/requests/[requestId]/accepted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { RequestRepository } from '@/repositories/RequestRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { UserRepository } from '@/repositories/UserRepository';

export async function POST(req: NextRequest) {
    try {
        // =========================
        // 認証
        // =========================
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        // =========================
        // ログインユーザー取得
        // =========================
        const currentUser =
            await UserRepository.findUserByUID(uid);

        if (!currentUser) {
            return NextResponse.json(
                { error: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // requestId取得
        // =========================
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');

        const requestIdStr =
            pathSegments[pathSegments.length - 2];

        const requestId = Number(requestIdStr);

        if (!requestId || isNaN(requestId)) {
            return NextResponse.json(
                { error: 'INVALID_REQUEST_ID' },
                { status: 400 }
            );
        }

        // =========================
        // request取得
        // =========================
        const request =
            await RequestRepository.getRequestById(requestId);

        if (!request) {
            return NextResponse.json(
                { error: 'REQUEST_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // 権限チェック（超重要）
        // =========================
        if (request.to_user_id !== currentUser.user_id) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // =========================
        // statusチェック
        // =========================
        if (request.status !== 'pending') {
            return NextResponse.json(
                { error: 'REQUEST_ALREADY_PROCESSED' },
                { status: 400 }
            );
        }

        // =========================
        // body
        // =========================
        const body = await req.json();

        const matchMessage: string =
            body.match_message?.trim();

        // =========================
        // メッセージバリデーション
        // =========================
        if (!matchMessage) {
            return NextResponse.json(
                { error: 'MESSAGE_REQUIRED' },
                { status: 400 }
            );
        }

        if (matchMessage.length > 200) {
            return NextResponse.json(
                { error: 'MESSAGE_TOO_LONG' },
                { status: 400 }
            );
        }

        // =========================
        // request承認
        // =========================
        const result =
            await RequestRepository.updateRequestStatus(
                requestId,
                'accepted'
            );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'REQUEST_ALREADY_PROCESSED' },
                { status: 400 }
            );
        }

        // =========================
        // match作成
        // =========================
        await MatchesRepository.insertMatch({
            request_id: request.id,
            post_id: request.post_id,
            from_user_id: request.to_user_id,
            to_user_id: request.from_user_id,
            match_message: matchMessage,
        });

        return NextResponse.json({
            success: true,
        });

    } catch (err) {
        console.error('処理中にエラー:', err);

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }
}