
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    PlusCircleIcon,
    BoltIcon,
    MagnifyingGlassIcon,
    ClipboardDocumentListIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    ClockIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

import SummaryCard from '@/app/components/ui/SummaryCard';

export default function HomePage() {
    const router = useRouter();

    const handleCreatePost = async () => {
        try {
            const res = await fetch('/api/kyc/userVerification');

            if (!res.ok) {
                throw new Error('本人確認情報の取得に失敗しました');
            }

            const data = await res.json();

            if (!data.verified) {
                router.push('/kyc');
                return;
            }

            router.push('/posts/create');
        } catch (err) {
            console.error(err);
            // 本人確認状態を確認できない場合は投稿画面へ進ませない
            alert('本人確認情報を確認できませんでした。時間をおいて再度お試しください。');
        }
    };

    const menuItems = [
        {
            title: '投稿リスト',
            description: '自分の募集状況を確認',
            href: '/posts/list',
            icon: ClipboardDocumentListIcon,
        },
        {
            title: 'リクエストリスト',
            description: '届いたリクエストを確認',
            href: '/requests',
            icon: ChatBubbleLeftRightIcon,
        },
        {
            title: 'マッチングリスト',
            description: '成立した相手を確認',
            href: '/matchings',
            icon: UserGroupIcon,
        },
        {
            title: 'マッチング履歴',
            description: '開催後の結果を回答',
            href: '/matchings/history',
            icon: ClockIcon,
        },
    ];

    return (
        <main className="min-h-screen bg-slate-50 px-4 pt-6 pb-24 text-slate-900 sm:px-6">

            <div className="mx-auto max-w-md space-y-7">

                {/* ページタイトル */}
                <section>
                    <h1 className="text-2xl font-bold tracking-tight">
                        ホーム
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        新しい出会いを見つけよう
                    </p>
                </section>

                {/* サマリー */}
                <SummaryCard />

                {/* メインアクション */}
                <section className="space-y-3">

                    <div className="mb-3">
                        <h2 className="text-lg font-bold">
                            合コンを始めよう
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            募集するか、気になるグループを探してみましょう
                        </p>
                    </div>

                    {/* 募集する */}
                    <button
                        type="button"
                        onClick={handleCreatePost}
                        className="group flex w-full items-center justify-between rounded-2xl bg-blue-600 p-5 text-left text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                                <PlusCircleIcon className="h-7 w-7" />
                            </div>

                            <div>
                                <p className="text-lg font-bold">
                                    合コンを募集する
                                </p>
                                <p className="mt-1 text-xs text-blue-100">
                                    一緒に楽しめるグループを募集
                                </p>
                            </div>
                        </div>

                        <ChevronRightIcon className="h-6 w-6 transition group-hover:translate-x-1" />
                    </button>

                    {/* 今すぐ飲みたい */}
                    <Link
                        href="/dashboard"
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <BoltIcon className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="font-bold text-slate-800">
                                    今すぐ飲みたい
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    すぐに会えるグループを探す
                                </p>
                            </div>
                        </div>

                        <ChevronRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </Link>

                    {/* 条件から探す */}
                    <Link
                        href="/search"
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <MagnifyingGlassIcon className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="font-bold text-slate-800">
                                    条件から探す
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    日程や希望条件から検索
                                </p>
                            </div>
                        </div>

                        <ChevronRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </Link>

                </section>

                {/* 各種メニュー */}
                <section className="space-y-3">

                    <div className="mb-3">
                        <h2 className="text-lg font-bold">
                            マイメニュー
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            募集やマッチングの状況を確認できます
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">

                        {menuItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group flex min-h-[76px] items-center justify-between px-4 py-3 transition hover:bg-blue-50/50 active:bg-blue-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRightIcon className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                                </Link>
                            );
                        })}

                    </div>

                </section>

            </div>
        </main>
    );
}
