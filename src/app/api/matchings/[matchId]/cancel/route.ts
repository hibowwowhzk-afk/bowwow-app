import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import db from '@/lib/db';

export async function POST(req: Request) {
    const connection = await db.getConnection();

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

        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 2];
        const matchIdNum = Number(matchIdStr);

        if (
            !matchIdNum ||
            Number.isNaN(matchIdNum)
        ) {
            return NextResponse.json(
                { error: 'INVALID_MATCH_ID' },
                { status: 400 }
            );
        }

        // マッチ取得
        const match =
            await MatchesRepository.findById(
                matchIdNum
            );

        if (!match) {
            return NextResponse.json(
                { error: 'MATCH_NOT_FOUND' },
                { status: 404 }
            );
        }

        // 権限チェック
        const isParticipant =
            match.from_user_id ===
                currentUser.user_id ||
            match.to_user_id ===
                currentUser.user_id;

        if (!isParticipant) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // 既にキャンセル済み
        if (match.status === 'canceled') {
            return NextResponse.json(
                {
                    error:
                        'MATCH_ALREADY_CANCELED',
                },
                { status: 400 }
            );
        }

        // Transaction Start
        await connection.beginTransaction();

        // matches 更新
        await MatchesRepository.cancelMatch(
            connection,
            matchIdNum
        );

        // requests 更新
        await RequestRepository.cancelRequestByMatchId(
            connection,
            matchIdNum
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
        });
    } catch (e) {
        await connection.rollback();

        console.error(e);

        return NextResponse.json(
            {
                error: 'INTERNAL_SERVER_ERROR',
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}