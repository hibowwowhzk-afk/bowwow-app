// src/app/api/posts/immediate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { shuffle } from 'lodash';

export async function GET(req: NextRequest) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // 自身のプロフィール取得
        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            throw new Error('ユーザー情報が見つかりません');
        }

        // 今すぐ飲みたい「active」投稿を取得
        let rows = await PostRepository.findImmediateActivePosts(user.gender, uid) as PostRow[];

        // lodash で投稿をランダムに並び替える
        rows = shuffle(rows);

        // 投稿ごとにまとめる
        const posts: any[] = [];
        const postMap: Record<number, any> = {};

        rows.forEach((row) => {
            if (!postMap[row.post_id]) {
                const dateObj = new Date(row.date);
                const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000);
                const dateOnly = jstDate.toISOString().split('T')[0];
        
                const newPost = {
                    id: row.post_id,
                    user_id: row.user_id,
                    message: row.message,
                    date: dateOnly,
                    user: {
                        display_name: row.display_name,
                        age: row.age,
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