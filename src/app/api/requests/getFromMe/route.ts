
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2/promise';
import { RequestRepository } from '@/repositories/RequestRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
    try {
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        // 自分から送ったリクエストを取得
        const requestList = await RequestRepository.getRequestsFromMe(user.user_id);

        // 対象の投稿IDを取得（重複排除）
        const postIds = [
            ...new Set(
                requestList.map((request: RowDataPacket) => Number(request.post_id))
            )
        ];

        // 募集投稿画像を取得
        const imageList = await RequestRepository.getRequestPostImages(postIds);

        // 投稿IDごとに画像をまとめる
        const imageMap = new Map<number, string[]>();

        for (const image of imageList) {
            const postId = Number(image.post_id);

            if (!imageMap.has(postId)) {
                imageMap.set(postId, []);
            }

            imageMap.get(postId)!.push(image.image_url);
        }

        // リクエストに画像一覧を追加
        const result = requestList.map((request: RowDataPacket) => ({
            ...request,
            post_images: imageMap.get(Number(request.post_id)) ?? []
        }));

        return NextResponse.json({
            requestList: result
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: 'データ取得に失敗しました' },
            { status: 500 }
        );
    }
}
