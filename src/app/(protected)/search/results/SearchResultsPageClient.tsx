
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search,
    SlidersHorizontal,
    CalendarDays,
    Cake,
    Zap,
    Tag,
    ArrowLeft,
    RotateCcw,
    AlertCircle,
    FileSearch,
} from 'lucide-react';

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
        const controller = new AbortController();

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
                const res = await fetch(
                    `/api/posts/search?${params.toString()}`,
                    { signal: controller.signal }
                );

                const data = await res.json();

                if (!res.ok) {
                    if (data.details && Array.isArray(data.details)) {
                        setErrors([
                            ...data.details.map((d: any) => d.message),
                            '検索からやり直してください。',
                        ]);
                    } else if (data.error) {
                        setErrors([
                            data.error,
                            '検索からやり直してください。',
                        ]);
                    } else {
                        setErrors([
                            '検索に失敗しました',
                            '検索からやり直してください。',
                        ]);
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
                if (e.name === 'AbortError') return;

                setErrors([
                    e.message || '検索に失敗しました',
                    '検索からやり直してください。',
                ]);
                setPosts([]);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchPosts();

        return () => {
            controller.abort();
        };
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

    const hasAgeCondition = Boolean(ageFrom || ageTo);
    const hasDateCondition = Boolean(isImmediate || dateFrom || dateTo);
    const hasKeywordCondition = Boolean(
        keywordMust || keywordOrList.some((kw) => kw.trim())
    );

    const hasCondition =
        hasAgeCondition || hasDateCondition || hasKeywordCondition;

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-lg">

                {/* ヘッダー */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center gap-2 text-blue-600">
                        <Search className="h-5 w-5" />
                        <span className="text-xs font-bold tracking-wider">
                            SEARCH RESULTS
                        </span>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                検索結果
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                条件に合った募集を表示しています。
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            条件変更
                        </button>
                    </div>
                </div>

                {/* 検索条件 */}
                <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <SlidersHorizontal className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">
                                検索条件
                            </h2>
                        </div>

                        {!hasCondition && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                条件指定なし
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* 年齢 */}
                        <div className="flex items-start gap-3">
                            <Cake className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">
                                    年齢
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                    {ageFrom || '指定なし'} ～ {ageTo || '指定なし'}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100" />

                        {/* 開催日 */}
                        <div className="flex items-start gap-3">
                            {isImmediate ? (
                                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            ) : (
                                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">
                                    開催日
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                    {isImmediate
                                        ? '今すぐ参加できる募集'
                                        : `${dateFrom || '指定なし'} ～ ${dateTo || '指定なし'}`}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100" />

                        {/* キーワード */}
                        <div className="flex items-start gap-3">
                            <Tag className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">
                                    キーワード
                                </p>

                                {hasKeywordCondition ? (
                                    <div className="mt-2 space-y-2">
                                        {keywordMust && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                                                    必須
                                                </span>
                                                <span className="break-all text-sm font-medium text-slate-700">
                                                    {keywordMust}
                                                </span>
                                            </div>
                                        )}

                                        {keywordOrList.some((kw) => kw.trim()) && (
                                            <div className="flex flex-wrap items-start gap-2">
                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                                    いずれか
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {keywordOrList
                                                        .filter((kw) => kw.trim())
                                                        .map((kw, index) => (
                                                            <span
                                                                key={`${kw}-${index}`}
                                                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                                                            >
                                                                {kw}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-0.5 text-sm font-medium text-slate-500">
                                        指定なし
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleBack}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                        <RotateCcw className="h-4 w-4" />
                        検索条件を変更する
                    </button>
                </div>

                {/* 検索結果件数 */}
                {!loading && errors.length === 0 && (
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800">
                            募集一覧
                        </h2>
                        <p className="text-xs text-slate-500">
                            <span className="text-base font-bold text-blue-600">
                                {posts.length}
                            </span>
                            件の募集
                        </p>
                    </div>
                )}

                {/* 読み込み中 */}
                {loading && (
                    <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                        <p className="mt-4 text-sm font-medium text-slate-500">
                            募集を検索しています...
                        </p>
                    </div>
                )}

                {/* エラー */}
                {!loading && errors.length > 0 && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <h2 className="text-sm font-bold">
                                検索エラー
                            </h2>
                        </div>

                        <ul className="space-y-2 text-sm text-red-600">
                            {errors.map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            onClick={handleBack}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            検索条件を見直す
                        </button>
                    </div>
                )}

                {/* 該当なし */}
                {!loading && errors.length === 0 && posts.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <FileSearch className="h-7 w-7" />
                        </div>

                        <h2 className="mt-4 text-base font-bold text-slate-800">
                            該当する募集がありません
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            検索条件を変更すると、<br />
                            募集が見つかるかもしれません。
                        </p>

                        <button
                            type="button"
                            onClick={handleBack}
                            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            条件を変更する
                        </button>
                    </div>
                )}

                {/* 投稿一覧 */}
                {!loading && errors.length === 0 && posts.length > 0 && (
                    <ul className="list-none space-y-4 p-0">
                        {posts.map((post, index) => (
                            <PostCard
                                key={
                                    post.id !== undefined
                                        ? `post-${post.id}`
                                        : `post-index-${index}`
                                }
                                post={post}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
