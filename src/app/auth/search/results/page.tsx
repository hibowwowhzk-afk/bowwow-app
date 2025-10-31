'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostCard } from '@/app/components/PostCard';

type Post = {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: {
        display_name: string;
        age: number;
        x_username?: string;
        insta_username?: string;
    };
    images?: { url: string; order: number }[];
};

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 検索条件を取得
    const ageFrom = searchParams.get('ageFrom') ?? '';
    const ageTo = searchParams.get('ageTo') ?? '';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const keyword1 = searchParams.get('keyword1') ?? '';
    const keyword2 = searchParams.get('keyword2') ?? '';
    const keyword3 = searchParams.get('keyword3') ?? '';
    const isImmediate = searchParams.get('immediate') === 'true';

    useEffect(() => {
        async function fetchPosts() {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();

            if (ageFrom) params.set('ageFrom', ageFrom);
            if (ageTo) params.set('ageTo', ageTo);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);
            if (keyword1) params.set('keyword1', keyword1);
            if (keyword2) params.set('keyword2', keyword2);
            if (keyword3) params.set('keyword3', keyword3);
            if (isImmediate) params.set('immediate', 'true');

            try {
                const res = await fetch(`/api/posts/search?${params.toString()}`);
                if (!res.ok) throw new Error('検索に失敗しました');
                const data = await res.json();
                setPosts(data);
            } catch (e: any) {
                setError(e.message);
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
        keyword1,
        keyword2,
        keyword3,
        isImmediate,
    ]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d.toLocaleDateString();
    };

    const handleBack = () => {
        const params = new URLSearchParams();

        if (ageFrom) params.set('ageFrom', ageFrom);
        if (ageTo) params.set('ageTo', ageTo);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (keyword1) params.set('keyword1', keyword1);
        if (keyword2) params.set('keyword2', keyword2);
        if (keyword3) params.set('keyword3', keyword3);
        if (isImmediate) params.set('immediate', 'true');

        router.push(`/auth/search?${params.toString()}`);
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

            {/* 検索条件表示 */}
            <div className="mb-6 p-4 bg-gray-100 rounded border">
                <h2 className="font-semibold mb-2">検索条件</h2>
                <ul className="text-gray-700 space-y-1">
                    <li>
                        年齢: {ageFrom ? `${ageFrom}歳` : '指定なし'} ～ {ageTo ? `${ageTo}歳` : '指定なし'}
                    </li>

                    <li>
                        日付:{' '}
                        {isImmediate
                            ? '今すぐ'
                            : `${formatDate(dateFrom) ?? '指定なし'} ～ ${formatDate(dateTo) ?? '指定なし'}`}
                    </li>

                    <li>
                        キーワード:{' '}
                        {[keyword1, keyword2, keyword3].filter(k => k).length > 0
                            ? [keyword1, keyword2, keyword3].filter(k => k).join(' / ')
                            : '指定なし'}
                    </li>
                </ul>
            </div>

            {loading && <p>読み込み中...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && posts.length === 0 && <p>該当する投稿がありません。</p>}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </ul>
        </section>
    );
}