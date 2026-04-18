// src/app/api/matchings/[matchId]/getConversationFromMatching/route.ts
import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { SnsNotificationsRepository } from '@/repositories/SnsNotificationsRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { PostRepository } from '@/repositories/PostRepository';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const matchIdStr = pathSegments[pathSegments.length - 2];
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

        // マッチングメッセージ取得
        const matchingMessageInfo = await MatchesRepository.getMatchDetail(matchId);
        if (!matchingMessageInfo) {
            return NextResponse.json({ error: 'マッチ情報が見つかりません' }, { status: 404 });
        }

        // DM送信メッセージ取得
        const dmMessageInfo = await SnsNotificationsRepository.getByMatchId(matchId);

        // リクエストメッセージ取得（matchingMessageInfo が null の場合は取得しない）
        let requestMessageInfo = null;
        if (matchingMessageInfo.request_id) {
            requestMessageInfo = await RequestRepository.getRequestDetailById(matchingMessageInfo.request_id);
        }

        // ポスト情報取得（requestMessageInfo が null の場合は取得しない）
        let postInfo = null;
        if (requestMessageInfo?.post_id) {
            postInfo = await PostRepository.getPostDetailById(requestMessageInfo.post_id);
        }

        return NextResponse.json({
            self_user_id: user.user_id,

            // ---- ポスト情報 ----
            post_message: postInfo?.message ?? null,
            post_date: postInfo?.date ?? null,
            post_images: postInfo?.post_images?.map(img => img.image_url) ?? [],
            post_user_id: postInfo?.user_id ?? null,
            post_created_at: postInfo?.created_at ?? null,

            // ---- リクエスト ----
            request_message: requestMessageInfo?.request_message ?? null,
            request_from_user_id: requestMessageInfo?.from_user_id ?? null,
            request_created_at: requestMessageInfo?.request_created_at ?? null,

            // ---- マッチング ----
            match_message: matchingMessageInfo.match_message ?? null,
            match_from_user_id: matchingMessageInfo.from_user_id ?? null,
            matched_at: matchingMessageInfo.created_at ?? null,

            // ---- DM ----
            dm_message: dmMessageInfo?.message ?? null,
            dm_from_user_id: dmMessageInfo?.from_user_id ?? null,
            dm_sent_at: dmMessageInfo?.sent_at ?? null,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
