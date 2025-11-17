// src/app/api/matchings/[matchId]/getConversationFromMatching/route.ts
import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { PostRepository } from '@/repositories/PostRepository';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 1]; // 最後のセグメント
        if (!matchIdStr) {
            return NextResponse.json({ error: 'matchId が指定されていません' }, { status: 400 });
        }
        const matchId = Number(matchIdStr);

        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
        }

        // matchId を使った処理
        const requestMessageInfo = await RequestRepository.getRequestDetailById(matchId);
        const postId = requestMessageInfo?.post_id;

        const postInfo = postId ? await PostRepository.getPostDetailById(postId) : null;
        if (!postInfo) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        return NextResponse.json({
            self_user_id: user.user_id,
            post_message: postInfo.message,
            post_date: postInfo.date,
            post_images: postInfo.post_images?.map(img => img.image_url) ?? [],
            post_user_id: postInfo.user_id,
            post_created_at: postInfo.created_at,
            request_message: requestMessageInfo?.request_message ?? null,
            request_from_user_id: requestMessageInfo?.from_user_id ?? null,
            request_created_at: requestMessageInfo?.request_created_at ?? null,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
