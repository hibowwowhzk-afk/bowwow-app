
import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { MatchMessagesRepository } from '@/repositories/MatchMessagesRepository';

export async function POST(req: Request) {
    try {
        // =========================
        // matchId取得
        // =========================
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 2];

        const matchId = Number(matchIdStr);

        if (!Number.isInteger(matchId) || matchId <= 0) {
            return NextResponse.json(
                { error: 'matchIdが不正です' },
                { status: 400 }
            );
        }

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

        const user = await UserRepository.findUserWithProfileByUID(
            authResult.uid
        );

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // リクエスト内容取得
        // =========================
        const body = await req.json().catch(() => null);

        if (!body || typeof body.message !== 'string') {
            return NextResponse.json(
                { error: 'メッセージを入力してください' },
                { status: 400 }
            );
        }

        const message = body.message.trim();

        if (!message) {
            return NextResponse.json(
                { error: 'メッセージを入力してください' },
                { status: 400 }
            );
        }

        if (message.length > 500) {
            return NextResponse.json(
                { error: 'メッセージは500文字以内で入力してください' },
                { status: 400 }
            );
        }

        // =========================
        // マッチング情報取得
        // =========================
        const matching =
            await MatchesRepository.getMatchDetail(matchId);

        if (!matching) {
            return NextResponse.json(
                { error: 'マッチ情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // 参加者チェック
        // =========================
        if (
            Number(matching.from_user_id) !== Number(user.user_id) &&
            Number(matching.to_user_id) !== Number(user.user_id)
        ) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // =========================
        // マッチング状態チェック
        // =========================
        if (matching.status !== 'active') {
            return NextResponse.json(
                { error: 'このマッチングではメッセージを送信できません' },
                { status: 400 }
            );
        }

        // =========================
        // メッセージ登録
        // =========================
        const result =
            await MatchMessagesRepository.insertWithLimit({
                match_id: matchId,
                sender_user_id: user.user_id,
                message,
            });

        return NextResponse.json({
            success: true,
            message: result.message,
            total_count: result.total_count,
            remaining_count: result.remaining_count,
        });

    } catch (err) {
        console.error('sendMessage error:', err);

        if (
            err instanceof Error &&
            err.message === 'MATCH_NOT_FOUND'
        ) {
            return NextResponse.json(
                { error: 'マッチ情報が見つかりません' },
                { status: 404 }
            );
        }

        if (
            err instanceof Error &&
            err.message === 'MESSAGE_LIMIT_REACHED'
        ) {
            return NextResponse.json(
                {
                    error: 'メッセージの送信上限20件に達しました',
                    total_count: 20,
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'メッセージの送信に失敗しました' },
            { status: 500 }
        );
    }
}
