// src/app/api/posts/[id]/getPosts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/PostRepository';

export async function GET(req: NextRequest) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const url = new URL(req.url);
        const postIdStr = url.pathname.split('/')[url.pathname.split('/').length - 2];
        const postId = Number(postIdStr);
        if (isNaN(postId)) {
            return NextResponse.json({ error: 'postId が無効です' }, { status: 400 });
        }

        // 投稿詳細（画像も含む）を取得
        const postDetail = await PostRepository.getPostDetailById(postId);
        if (!postDetail) {
            return NextResponse.json({ error: 'ポスト情報が見つかりません' }, { status: 404 });
        }

        return NextResponse.json({ post: postDetail });
    } catch (err) {
        console.error('[GET_POST_ERROR]', err);
        return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
    }
}
