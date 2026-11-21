
// src/app/api/matchings/getFromOthers/route.ts

import { NextResponse } from 'next/server';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { MatchMessagesRepository } from '@/repositories/MatchMessagesRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        // 自分のプロフィール取得
        const user = await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        // 相手からのマッチング取得
        const rows = await MatchesRepository.getMatchingsFromOthers(user.user_id);

        // マッチングID取得
        const matchIds = rows.map(row => row.match_id);

        // 最新メッセージを一括取得
        const latestMessages =
            await MatchMessagesRepository.getLatestMessagesByMatchIds(matchIds);

        // マッチングIDをキーにする
        const latestMessageMap = new Map(
            latestMessages.map(message => [
                message.match_id,
                message,
            ])
        );

        // 最新メッセージをマッチング一覧に結合
        const matchingsList = rows.map(row => {
            const latestMessage = latestMessageMap.get(row.match_id);

            return {
                ...row,
                last_message:
                    latestMessage?.last_message ?? row.match_message,
                last_message_at:
                    latestMessage?.last_message_at ?? row.matched_at,
            };
        });

        return NextResponse.json({ matchingsList });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: 'データ取得に失敗しました' },
            { status: 500 }
        );
    }
}
