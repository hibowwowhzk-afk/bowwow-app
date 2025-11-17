// src/app/api/matchings/[matchId]/notifySnsMessage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { SnsNotificationsRepository } from '@/repositories/SnsNotificationsRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 2]; // [matchId] の位置
        if (!matchIdStr) {
            return NextResponse.json({ error: 'matchId が指定されていません' }, { status: 400 });
        }
        const matchId = Number(matchIdStr);
        if (isNaN(matchId)) {
            return NextResponse.json({ error: 'matchId が無効です' }, { status: 400 });
        }

        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // 自分のプロフィール取得
        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
        }

        const body = await req.json();
        const message: string = body.message ?? 'DM送信しました。よろしくお願いします。';

        // マッチ情報から相手の user_id を取得
        const match = await MatchesRepository.findMatchIdAndToUser(matchId);
        if (!match) {
            return NextResponse.json({ error: 'マッチが見つかりません' }, { status: 404 });
        }

        // 通知登録
        await SnsNotificationsRepository.create({
            match_id: match.match_id,
            from_user_id: user.user_id,
            to_user_id: match.to_user_id,
            message,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: '通知送信に失敗しました' }, { status: 500 });
    }
}
