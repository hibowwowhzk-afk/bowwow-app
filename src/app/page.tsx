
'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-white pb-24">

            {/* ヘッダー */}
            <header className="sticky top-0 z-40 bg-[#1760f5] shadow-md">
                <div className="max-w-2xl mx-auto flex justify-between items-center px-5 h-14">
                    <h1 className="text-xl font-black tracking-tight text-white">
                        GOKON+
                    </h1>

                    <button
                        onClick={() => router.push('/login')}
                        className="text-sm font-bold text-white px-3 py-2 hover:bg-white/10 rounded-lg transition"
                    >
                        ログイン
                    </button>
                </div>
            </header>

            {/* メインビジュアル */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100">

                <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-200 rounded-full opacity-40 blur-3xl" />
                <div className="absolute bottom-0 -left-16 w-48 h-48 bg-sky-200 rounded-full opacity-40 blur-3xl" />

                <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-12">

                    <div className="text-center">

                        <span className="inline-block bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm mb-5">
                            ✨ 友達と一緒に、新しい出会いを
                        </span>

                        <h2 className="text-[34px] leading-tight font-black text-gray-800">
                            いつもの仲間と
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">
                                新しい出会い
                            </span>
                            <br />
                            はじめよう！
                        </h2>

                        <p className="text-sm text-gray-600 leading-relaxed mt-5">
                            友達同士で気軽に参加！
                            <br />
                            グループ同士をつなぐ合コンマッチング。
                        </p>

                    </div>

                    {/* グループイメージ */}
                    <div className="mt-9 relative">

                        <div className="bg-white/90 rounded-[28px] shadow-xl p-5 border border-blue-50">

                            <p className="text-center text-xs font-extrabold tracking-widest text-blue-600 mb-5">
                                GROUP × GROUP
                            </p>

                            <div className="flex items-center justify-center gap-3">

                                <div className="flex-1 text-center">
                                    <div className="flex justify-center -space-x-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center text-3xl">
                                            👩
                                        </div>
                                        <div className="w-14 h-14 rounded-full bg-sky-100 border-4 border-white flex items-center justify-center text-3xl">
                                            👨
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 mt-2">
                                        あなたのグループ
                                    </p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-2xl text-blue-500">♥</span>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        MATCH
                                    </span>
                                </div>

                                <div className="flex-1 text-center">
                                    <div className="flex justify-center -space-x-4">
                                        <div className="w-14 h-14 rounded-full bg-sky-100 border-4 border-white flex items-center justify-center text-3xl">
                                            👩
                                        </div>
                                        <div className="w-14 h-14 rounded-full bg-indigo-100 border-4 border-white flex items-center justify-center text-3xl">
                                            👨
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 mt-2">
                                        新しいグループ
                                    </p>
                                </div>

                            </div>

                            <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-center py-4">
                                <p className="text-xs opacity-90">
                                    友達と一緒だから、もっと楽しい！
                                </p>
                                <p className="font-black text-xl mt-1">
                                    Let's GOKON! 🎉
                                </p>
                            </div>

                        </div>

                    </div>

                    <p className="text-center text-xs text-gray-500 mt-5">
                        18歳以上の方がご利用いただけます
                    </p>

                </div>
            </section>

            {/* 特徴 */}
            <section className="px-5 py-12">
                <div className="max-w-2xl mx-auto">

                    <div className="text-center mb-8">
                        <p className="text-xs font-extrabold tracking-widest text-blue-600">
                            FEATURES
                        </p>
                        <h2 className="text-2xl font-black text-gray-800 mt-2">
                            GOKON+ の魅力
                        </h2>
                    </div>

                    <div className="space-y-4">

                        <div className="flex gap-4 items-center bg-blue-50 rounded-2xl p-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-3xl">
                                👫
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    グループ同士で出会える
                                </h3>
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                    友達と一緒に参加できるから、気軽に新しい出会いを楽しめます。
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center bg-sky-50 rounded-2xl p-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-3xl">
                                🍻
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    食事や会話を楽しもう
                                </h3>
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                    新しい仲間との交流を通じて、楽しい時間を過ごそう。
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center bg-indigo-50 rounded-2xl p-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white flex items-center justify-center text-3xl">
                                🛡️
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    本人確認で安心
                                </h3>
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                    本人確認の仕組みを導入し、安全な交流環境を目指します。
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 利用方法 */}
            <section className="bg-gray-50 px-5 py-12">
                <div className="max-w-2xl mx-auto">

                    <div className="text-center mb-9">
                        <p className="text-xs font-extrabold tracking-widest text-blue-600">
                            HOW TO USE
                        </p>
                        <h2 className="text-2xl font-black text-gray-800 mt-2">
                            参加までの3ステップ
                        </h2>
                    </div>

                    <div className="space-y-5">

                        {[
                            {
                                step: '01',
                                emoji: '📝',
                                title: 'アカウント登録',
                                text: 'まずはアカウントを作成してプロフィールを登録'
                            },
                            {
                                step: '02',
                                emoji: '🔍',
                                title: '合コンを探す',
                                text: '気になるグループを見つけて申し込み'
                            },
                            {
                                step: '03',
                                emoji: '🎉',
                                title: '合コン当日！',
                                text: 'マッチングしたグループと楽しい時間を過ごそう'
                            }
                        ].map((item) => (
                            <div
                                key={item.step}
                                className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm"
                            >
                                <div className="text-center shrink-0">
                                    <p className="text-xs font-black text-blue-500">
                                        STEP
                                    </p>
                                    <p className="text-xl font-black text-blue-600">
                                        {item.step}
                                    </p>
                                </div>

                                <div className="text-3xl">
                                    {item.emoji}
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* 最後のメッセージ */}
            <section className="px-5 py-14 text-center bg-gradient-to-br from-blue-50 to-sky-100">
                <div className="max-w-2xl mx-auto">

                    <p className="text-3xl mb-4">💕</p>

                    <h2 className="text-2xl font-black text-gray-800 leading-relaxed">
                        いつもの日常に、
                        <br />
                        新しい出会いを。
                    </h2>

                    <p className="text-sm text-gray-600 mt-4">
                        さあ、新しい合コンを始めよう！
                    </p>

                    <button
                        onClick={() => router.push('/register')}
                        className="mt-8 w-full py-4 rounded-full bg-[#1760f5] text-white font-bold shadow-lg hover:bg-blue-700 transition"
                    >
                        無料で新規登録する →
                    </button>

                </div>
            </section>

            {/* フッター */}
            <footer className="bg-gray-900 text-center py-7 px-5">
                <p className="text-white font-black text-xl">
                    GOKON+
                </p>
                <p className="text-gray-400 text-xs mt-3">
                    © 2026 GOKON+. All Rights Reserved.
                </p>
            </footer>

            {/* 下部固定ボタン */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => router.push('/register')}
                        className="w-full py-3.5 rounded-full bg-[#1760f5] text-white font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition"
                    >
                        🎉 無料で新規登録
                    </button>
                </div>
            </div>

        </main>
    );
}
