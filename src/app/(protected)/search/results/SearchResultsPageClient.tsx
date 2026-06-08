'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostCard } from '@/app/components/PostCard';

type Post = {
    id?: number;
    user_id: number;
    message: string;
    created_at: string;
    date: string;
    user?: {
        display_name?: string;
        age?: number;
        x_username?: string;
        insta_username?: string;
    };
    images?: { url: string; order: number }[];
};

export default function SearchResultsPageClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const ageFrom = searchParams.get('ageFrom') ?? '';
    const ageTo = searchParams.get('ageTo') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const isImmediate = searchParams.get('immediate') === 'true';

    const keywordMust = searchParams.get('keywordMust') ?? '';
    const keywordOrList = searchParams.getAll('keywordOr');

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            setErrors([]);

            const params = new URLSearchParams();

            if (ageFrom) params.set('ageFrom', ageFrom);
            if (ageTo) params.set('ageTo', ageTo);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (isImmediate) params.set('immediate', 'true');

            if (keywordMust) params.set('keywordMust', keywordMust);

            keywordOrList.forEach((kw) => {
                params.append('keywordOr', kw);
            });

            try {
                const res = await fetch(`/api/posts/search?${params.toString()}`);
                const data = await res.json();

                if (!res.ok) {
                    // サーバーのバリデーションエラーをリスト化
                    if (data.details && Array.isArray(data.details)) {
                        setErrors([
                            ...data.details.map((d: any) => d.message),
                            '検索からやり直してください。',
                        ]);
                    } else if (data.error) {
                        setErrors([data.error, '検索からやり直してください。']);
                    } else {
                        setErrors(['検索に失敗しました', '検索からやり直してください。']);
                    }
                    setPosts([]);
                    return;
                }

                const postsWithDate: Post[] = data.map((post: any) => ({
                    ...post,
                    date: post.date ?? post.created_at,
                }));

                setPosts(postsWithDate);
            } catch (e: any) {
                setErrors([e.message, '検索からやり直してください。']);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [
        ageFrom,
        ageTo,
        dateFrom,
        dateTo,
        isImmediate,
        keywordMust,
        keywordOrList.join('|'),
    ]);

    const handleBack = () => {
        const params = new URLSearchParams();

        if (ageFrom) params.set('ageFrom', ageFrom);
        if (ageTo) params.set('ageTo', ageTo);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (isImmediate) params.set('immediate', 'true');

        if (keywordMust) params.set('keywordMust', keywordMust);

        keywordOrList.forEach((kw) => {
            params.append('keywordOr', kw);
        });

        router.push(`/search?${params.toString()}`);
    };

    return (
        <section className="max-w-lg mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">検索結果</h1>

            <button
                onClick={handleBack}
                className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
                検索画面に戻る
            </button>

            <div className="mb-6 p-4 bg-gray-100 rounded border">
                <h2 className="font-semibold mb-2">検索条件</h2>

                <ul className="text-gray-700 space-y-1">
                    <li>
                        年齢: {ageFrom || '指定なし'} ～ {ageTo || '指定なし'}
                    </li>
                    <li>
                        日付:{' '}
                        {isImmediate
                            ? '今すぐ'
                            : `${dateFrom || '指定なし'} ～ ${dateTo || '指定なし'}`}
                    </li>
                    <li>
                        キーワード:
                        {keywordMust || keywordOrList.length > 0 ? (
                            <div className="mt-1 text-sm">
                                <div>必須: {keywordMust || '-'}</div>
                                <div>
                                    いずれか:{' '}
                                    {keywordOrList.length > 0
                                        ? keywordOrList.join(', ')
                                        : '-'}
                                </div>
                            </div>
                        ) : (
                            ' 指定なし'
                        )}
                    </li>
                </ul>
            </div>

            {loading && <p>読み込み中...</p>}

            {errors.length > 0 && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
                    <ul className="list-disc pl-5 space-y-1">
                        {errors.map((msg, i) => (
                            <li key={i}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            {!loading && errors.length === 0 && posts.length === 0 && (
                <p>該当する投稿がありません。</p>
            )}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {posts.map((post, index) => (
                    <PostCard
                        key={post.id !== undefined ? `post-${post.id}` : `post-index-${index}`}
                        post={post}
                    />
                ))}
            </ul>
        </section>
    );
}