// src/app/api/posts/[id]/getPosts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';

export async function GET(req: NextRequest) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Firebase uid
        const firebaseUid = authResult.uid;

        // DBユーザー取得
        const currentUser = await UserRepository.findUserByUID(firebaseUid);

        if (!currentUser) {
            return NextResponse.json(
                { error: 'ユーザーが存在しません' },
                { status: 404 }
            );
        }

        const url = new URL(req.url);

        const postIdStr =
            url.pathname.split('/')[url.pathname.split('/').length - 2];

        const postId = Number(postIdStr);

        if (isNaN(postId)) {
            return NextResponse.json(
                { error: 'postId が無効です' },
                { status: 400 }
            );
        }

        // 投稿取得
        const postDetail = await PostRepository.getPostDetailById(postId);

        if (!postDetail || postDetail.user_id !== currentUser.user_id) {
            return NextResponse.json(
                { error: 'ポスト情報が見つかりません' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            post: postDetail,
        });

    } catch (err) {
        console.error('[GET_POST_ERROR]', err);

        return NextResponse.json(
            { error: 'サーバーエラー' },
            { status: 500 }
        );
    }
}