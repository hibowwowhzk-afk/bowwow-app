'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    const goToLogin = () => router.push('/login');
    const goToRegister = () => router.push('/register');

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                {/* ヘッダー */}
                <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">ようこそ！</h1>
                <p className="text-gray-600 text-center mb-6">
                    楽しく会を楽しむためのマッチングサービスです。
                </p>

                {/* 特徴リスト */}
                <ul className="w-full mb-8 space-y-3">
                    <li className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        <span className="text-blue-400 text-xl">🎉</span> 気軽に合コン相手を探せる
                    </li>
                    <li className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                        <span className="text-yellow-400 text-xl">✔️</span> 安心・安全の本人確認
                    </li>
                </ul>

                {/* ボタン */}
                <div className="flex flex-col gap-4 w-full">
                    <button
                        onClick={goToRegister}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                    >
                        新規登録
                    </button>
                    <button
                        onClick={goToLogin}
                        className="w-full py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition duration-200"
                    >
                        ログイン
                    </button>
                </div>
            </div>
        </main>
    );
}
