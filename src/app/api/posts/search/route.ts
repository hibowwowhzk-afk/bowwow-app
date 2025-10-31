// src/app/api/posts/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { PostSearchParams } from '@/repositories/PostRepository';

export async function GET(req: NextRequest) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            throw new Error('ユーザー情報が見つかりません');
        }

        const { searchParams } = new URL(req.url);
        const ageFrom = searchParams.get('ageFrom');
        const ageTo = searchParams.get('ageTo');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const keyword1 = searchParams.get('keyword1');
        const keyword2 = searchParams.get('keyword2');
        const keyword3 = searchParams.get('keyword3');
        const isImmediate = searchParams.get('immediate') === 'true';

        const keywords = [keyword1, keyword2, keyword3].filter(Boolean) as string[];

        const params: PostSearchParams = {
            ageFrom: ageFrom ? parseInt(ageFrom) : undefined,
            ageTo: ageTo ? parseInt(ageTo) : undefined,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            keywords: keywords.length > 0 ? keywords : undefined,
            isImmediate,
        };

        const rows = await PostRepository.searchPosts(params, user.user_id, user.gender);

        const posts: any[] = [];
        const postMap: Record<number, any> = {};

        rows.forEach((row: PostRow) => {
            if (!postMap[row.post_id]) {
                const newPost = {
                    id: row.post_id,
                    user_id: row.user_id,
                    message: row.message,
                    created_at: row.created_at,
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
    } catch (error: any) {
        console.error('検索エラー:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}