// src/app/api/user/[userId]/getSnsAccounts/route.ts

import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET(req: Request) {
    try {
        // URLから userId を取得
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        // 例: /api/user/123/getSnsAccounts
        const userId = pathSegments[pathSegments.length - 2];
        if (!userId) {
            return NextResponse.json({ error: 'userId が指定されていません' }, { status: 400 });
        }

        // セッション認証チェック
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // プロフィール取得
        const profile = await UserRepository.findProfileByUserId(userId);
        if (!profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        // 必要なSNSアカウント情報を返す
        return NextResponse.json({
            twitter: profile.x_username ?? null,
            instagram: profile.insta_username ?? null,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'SNSアカウント取得中にエラーが発生しました' },
            { status: 500 }
        );
    }
}
