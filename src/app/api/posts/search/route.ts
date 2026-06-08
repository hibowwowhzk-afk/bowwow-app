// src/app/api/posts/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository, type PostRow } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';

export async function GET(req: NextRequest) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = await UserRepository.findUserWithProfileByUID(authResult.uid);
        if (!user) {
            return NextResponse.json(
                { error: 'user not found' },
                { status: 404 }
            );
        }

        const input = parseSearchParams(new URL(req.url).searchParams);
        const { errors, value } = validateSearchInput(input);

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Bad Request', details: errors },
                { status: 400 }
            );
        }

        const rows = await PostRepository.searchPosts(value, user.user_id, user.gender);

        const posts: any[] = [];
        const postMap: Record<number, any> = {};

        rows.forEach((row: PostRow) => {
            if (!postMap[row.post_id]) {
                const newPost = {
                    id: row.post_id,
                    user_id: row.user_id,
                    message: row.message,
                    date: row.date,
                    user: {
                        display_name: row.display_name ?? '名無し',
                        age: row.age ?? undefined,
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

        // デバッグログ
        console.log('整形後のsearchPosts結果:', JSON.stringify(posts, null, 2));

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error('検索エラー:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

function parseSearchParams(searchParams: URLSearchParams) {
    return {
        ageFrom: searchParams.get('ageFrom'),
        ageTo: searchParams.get('ageTo'),
        dateFrom: searchParams.get('dateFrom'),
        dateTo: searchParams.get('dateTo'),
        isImmediate: searchParams.get('immediate') === 'true',
        keywordMust: searchParams.get('keywordMust')?.trim() ?? '',
        keywordOr: searchParams.getAll('keywordOr').map(v => v.trim()).filter(Boolean),
    };
}

function validateSearchInput(input: any) {
    type ErrorItem = { code: string; message: string };
    const errors: ErrorItem[] = [];

    const ageFrom = input.ageFrom ? Number(input.ageFrom) : undefined;
    const ageTo = input.ageTo ? Number(input.ageTo) : undefined;

    if (input.ageFrom && Number.isNaN(ageFrom)) {
        errors.push({ code: 'AGE_FROM_INVALID', message: '年齢（から）が不正です' });
    }

    if (input.ageTo && Number.isNaN(ageTo)) {
        errors.push({ code: 'AGE_TO_INVALID', message: '年齢（まで）が不正です' });
    }

    if (ageFrom && ageTo && ageFrom > ageTo) {
        errors.push({ code: 'AGE_RANGE_INVALID', message: '年齢の範囲が不正です' });
    }

    const dateFrom = input.dateFrom;
    const dateTo = input.dateTo;
    const isImmediate = input.isImmediate;
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

    if (isImmediate && (dateFrom || dateTo)) {
        errors.push({ code: 'DATE_INVALID_WITH_IMMEDIATE', message: '今すぐ検索の場合、日付指定はできません' });
    }

    if (!isImmediate) {
        if (dateFrom && !DATE_REGEX.test(dateFrom)) {
            errors.push({ code: 'DATE_FROM_INVALID', message: '日付（から）が不正です' });
        }
        if (dateTo && !DATE_REGEX.test(dateTo)) {
            errors.push({ code: 'DATE_TO_INVALID', message: '日付（まで）が不正です' });
        }
        if (dateFrom && dateTo && DATE_REGEX.test(dateFrom) && DATE_REGEX.test(dateTo) && dateFrom > dateTo) {
            errors.push({ code: 'DATE_RANGE_INVALID', message: '日時の範囲指定が不正です' });
        }
    }

    if (input.keywordMust.length >= 50) {
        errors.push({ code: 'KEYWORD_MUST_TOO_LONG', message: 'メインキーワードは50字以内です' });
    }

    if (input.keywordOr.length > 3) {
        errors.push({ code: 'KEYWORD_OR_TOO_MANY', message: 'サブキーワードは3つ以内です' });
    }

    if (input.keywordOr.some((v: string) => v.length >= 30)) {
        errors.push({ code: 'KEYWORD_OR_TOO_LONG', message: 'サブキーワードは30字以内です' });
    }

    return {
        errors,
        value: { ...input, ageFrom, ageTo },
    };
}