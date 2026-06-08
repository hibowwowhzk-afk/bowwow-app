// src/app/api/matchings/getHistory/route.ts

import { NextResponse } from 'next/server';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
    try {
        // セッション認証
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

        // 過去のマッチング履歴取得
        const rows = await MatchesRepository.getMatchHistory(user.user_id);

        const formatted = rows.map((row: any) => ({
            ...row,
            post_date: new Date(row.post_date).toLocaleDateString('ja-JP'),
        }));

        return NextResponse.json({ histories: formatted });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
    }
}