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
        const uid = authResult.uid;

        // URL から postId を取得
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const postIdStr = pathSegments[pathSegments.length - 2]; // [id] の部分
        if (!postIdStr) {
            return NextResponse.json({ error: 'postId が指定されていません' }, { status: 400 });
        }
        const postId = Number(postIdStr);
        if (isNaN(postId)) {
            return NextResponse.json({ error: 'postId が無効です' }, { status: 400 });
        }

        // 投稿情報を取得
        const postData: PostRow | null = await PostRepository.findPostById(postId);
        if (!postData) {
            return NextResponse.json({ error: 'ポスト情報が見つかりません' }, { status: 404 });
        }

        // 返却用に整形（画像を配列にまとめる）
        const response = {
            post: {
                id: postData.post_id,
                message: postData.message,
                date: postData.date,
                created_at: postData.created_at,
                is_immediate: postData.is_immediate,
                post_images: postData.image_url
                    ? [{ image_url: postData.image_url, order: postData.image_order || 1 }]
                    : [],
            },
        };

        return NextResponse.json(response);
    } catch (err) {
        console.error('[GET_POST_ERROR]', err);
        return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
    }
}
