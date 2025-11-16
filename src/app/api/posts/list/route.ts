// src/app/api/posts/list/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';

export async function GET(req: NextRequest) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            throw new Error('ユーザー情報が見つかりません');
        }

        // 自分の投稿一覧を取得
        const rows: PostRow[] = await PostRepository.findByUserId(user.user_id);

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('検索エラー:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}