// src/app/api/posts/immediate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/postRepository';
import { UserRepository } from '@/repositories/userRepository';
import { shuffle } from 'lodash';

export async function GET(req: NextRequest) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // 自分の性別を取得
        const userGender = await UserRepository.findUserWithProfileByUID(uid);
        if (!userGender) {
            throw new Error('ユーザー情報が見つかりません');
        }

        // 今すぐ飲みたい「active」投稿を取得
        let rows = await PostRepository.findImmediateActivePosts(userGender.gender, uid) as PostRow[];

        // lodash で投稿をランダムに並び替える
        rows = shuffle(rows);

        // 投稿ごとにまとめる
        const posts: any[] = [];
        const postMap: Record<number, any> = {};

        rows.forEach((row) => {
            if (!postMap[row.post_id]) {
                const newPost = {
                    id: row.post_id,
                    user_id: row.user_id,
                    message: row.message,
                    created_at: row.created_at,
                    user: {
                        display_name: row.display_name,
                        x_username: row.x_username ?? null,
                        insta_username: row.insta_username ?? null,
                    },
                    images: [] as { url: string; order: number }[],
                };
                postMap[row.post_id] = newPost;
                posts.push(newPost);
            }

            if (row.image_url) {
                postMap[row.post_id].images.push({
                    url: row.image_url,
                    order: row.image_order ?? 1,
                });
            }
        });

        return NextResponse.json(posts);
    } catch (err: any) {
        console.error('immediate posts error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}