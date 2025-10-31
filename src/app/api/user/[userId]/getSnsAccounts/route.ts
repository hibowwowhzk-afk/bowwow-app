// src/app/api/user/[userId]/getSnsAccounts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const params = await context.params;

    // セッション認証チェック
    const authResult = await verifySessionFromRequest();
    if ('error' in authResult) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // プロフィール取得
    const profile = await UserRepository.findProfileByUserId(params.userId);
    if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 必要なSNSアカウント情報を返す
    return NextResponse.json({
        twitter: profile.x_username ?? null,
        instagram: profile.insta_username ?? null,
    });
}