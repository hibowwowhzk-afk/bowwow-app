import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';

export async function POST(req: Request) {

    try {
        // 認証
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // ユーザー取得
        const currentUser =
            await UserRepository.findUserByUID(
                authResult.uid
            );

        if (!currentUser) {
            return NextResponse.json(
                { error: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // requestsID
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const requestIdStr = pathSegments[pathSegments.length - 2];
        const requestIdStrNum = Number(requestIdStr);

        if (!requestIdStrNum || Number.isNaN(requestIdStrNum)) {
            return NextResponse.json(
                { error: 'INVALID_REQUEST_ID' },
                { status: 400 }
            );
        }

        // リクエスト取得
        const request = await RequestRepository.findById(requestIdStrNum);

        if (!request) {
            return NextResponse.json(
                { error: 'REQUEST_NOT_FOUND' },
                { status: 404 }
            );
        }

        // 権限チェック
        const isParticipant =
            request.from_user_id ===
                currentUser.user_id ||
            request.to_user_id ===
                currentUser.user_id;

        if (!isParticipant) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // 既にキャンセル済み
        if (request.status === 'canceled' || request.status === 'rejected') {
            return NextResponse.json(
                {
                    error:
                        'MATCH_ALREADY_CANCELED',
                },
                { status: 400 }
            );
        }

        // requests 更新
        await RequestRepository.cancelRequestById(requestIdStrNum);

        return NextResponse.json({
            success: true,
        });
    } catch (e) {
        return NextResponse.json(
            {
                error: 'INTERNAL_SERVER_ERROR',
            },
            { status: 500 }
        );
    }
}