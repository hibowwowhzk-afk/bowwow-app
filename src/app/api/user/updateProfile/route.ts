// src/app/api/user/updateProfile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function POST(req: NextRequest) {
    try {
        // セッション認証関数
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // DBからuser_id取得
        const user = await UserRepository.findUserByUID(uid);
        if (!user) {
        return NextResponse.json({ error: 'ユーザーが見つかりませんでした' }, { status: 404 });
        }

        // リクエストボディからプロフィール情報を取得
        const body = await req.json();
        const { display_name, age, residence, occupation, message } = body;

        // バリデーション（必要に応じて）
        if (!display_name || typeof age !== 'number') {
        return NextResponse.json({ error: '入力が不正です' }, { status: 400 });
        }

        // プロフィール更新
        await UserRepository.updateProfile(user.user_id, {
        display_name,
        age,
        residence,
        occupation,
        message,
        updated_by: uid, // 操作ユーザーを記録する場合
        });

        return NextResponse.json({ message: 'プロフィールを更新しました' });
    } catch (err) {
        console.error('[UPDATE_PROFILE_ERROR]', err);
        return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
    }
}