// src/app/api/matchings/[matchId]/getConversationFromMatching/route.ts
import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { PostRepository } from '@/repositories/PostRepository';
import { SnsNotificationsRepository } from '@/repositories/SnsNotificationsRepository';

export async function GET(req: Request, { params }: { params: { matchId: string } }) {
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

        const matchId = Number(params.matchId);
        // ---- 承諾メッセージ（マッチ情報） ----
        const matchMessageInfo = await MatchesRepository.getMatchDetail(matchId);
        if (!matchMessageInfo) {
            return NextResponse.json(
                { error: 'Matching not found' },
                { status: 404 }
            );
        }
        const requestId = matchMessageInfo.request_id;
        const postId = matchMessageInfo.post_id;

        // ---- DM送信通知 ----
        const dmMessageInfo = await SnsNotificationsRepository.getByMatchId(matchId);

        // ---- リクエストメッセージ ----
        let requestMessageInfo = null;
        if (requestId) {
            requestMessageInfo = await RequestRepository.getRequestDetailById(requestId);
        }

        // ---- ポスト情報 ----
        let postInfo = null;
        if (postId) {
            postInfo = await PostRepository.getPostDetailById(postId);
        }

        if (!postInfo) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
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

            // ---- 承諾（マッチ） ----
            match_message: matchMessageInfo?.match_message ?? null,
            match_from_user_id: matchMessageInfo?.from_user_id ?? null,
            matched_at: matchMessageInfo?.created_at ?? matchMessageInfo?.matched_at ?? null,

            // ---- DM通知 ----
            dm_message: dmMessageInfo?.message ?? null,
            dm_from_user_id: dmMessageInfo?.from_user_id ?? null,
            dm_sent_at: dmMessageInfo?.sent_at ?? null,
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}