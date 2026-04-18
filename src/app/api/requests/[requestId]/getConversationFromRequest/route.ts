// src/app/api/matchings/[requestId]/getConversationFromMatching/route.ts

import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { PostRepository } from '@/repositories/PostRepository';

export async function GET(req: Request) {
    try {
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
        const selfUserId = user.user_id;

        // URLから requestId を取得
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        // 例: /api/matchings/123/getConversationFromMatching
        const requestIdStr = pathSegments[pathSegments.length - 2]; 
        const requestId = Number(requestIdStr);
        if (!requestId || isNaN(requestId)) {
            return NextResponse.json({ error: '不正な requestId です' }, { status: 400 });
        }

        const requestMessageInfo = await RequestRepository.getRequestDetailById(requestId);
        const postId = requestMessageInfo?.post_id;

        // ---- ポスト情報 ----
        const postInfo = postId ? await PostRepository.getPostDetailById(postId) : null;
        if (!postInfo) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({
            self_user_id: selfUserId,

            // ---- ポスト情報 ----
            post_message: postInfo.message,
            post_date: postInfo.date,
            post_images: postInfo.post_images?.map(img => img.image_url) ?? [],
            post_user_id: postInfo.user_id,
            post_created_at: postInfo.created_at,

            // ---- リクエスト ----
            request_message: requestMessageInfo?.request_message ?? null,
            request_from_user_id: requestMessageInfo?.from_user_id ?? null,
            request_created_at: requestMessageInfo?.request_created_at ?? null,
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
