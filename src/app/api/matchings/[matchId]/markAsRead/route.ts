
import { NextResponse } from 'next/server';

import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { MatchMessagesRepository } from '@/repositories/MatchMessagesRepository';

export async function POST(req: Request) {
    try {
        // =========================
        // matchId 取得
        // =========================
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 2];

        if (!matchIdStr) {
            return NextResponse.json(
                { error: 'matchId が指定されていません' },
                { status: 400 }
            );
        }

        const matchId = Number(matchIdStr);

        if (!Number.isInteger(matchId) || matchId <= 0) {
            return NextResponse.json(
                { error: 'matchId が不正です' },
                { status: 400 }
            );
        }

        // =========================
        // ログインユーザー確認
        // =========================
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        const user =
            await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // マッチング情報取得
        // =========================
        const matchingInfo =
            await MatchesRepository.getMatchDetail(matchId);

        if (!matchingInfo) {
            return NextResponse.json(
                { error: 'マッチ情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // 権限チェック
        // =========================
        if (
            Number(matchingInfo.from_user_id) !== Number(user.user_id) &&
            Number(matchingInfo.to_user_id) !== Number(user.user_id)
        ) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // =========================
        // 未読メッセージを既読に更新
        // 自分が送信したメッセージは対象外
        // =========================
        await MatchMessagesRepository.markAsRead(
            matchId,
            Number(user.user_id)
        );

        return NextResponse.json({
            success: true,
            message: '既読に更新しました',
        });

    } catch (err) {
        console.error('[POST markAsRead]', err);

        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}
