
'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // メールアドレス登録
    const handleEmailRegister = async () => {
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        // Gmailの場合はGoogle登録を案内
        if (cleanEmail.toLowerCase().endsWith('@gmail.com')) {
            alert('Gmailアドレスの場合は「Googleで登録」をご利用ください。');
            return;
        }

        try {
            setLoading(true);

            if (!cleanEmail || !cleanEmail.includes('@')) {
                alert('メールアドレスが不正です');
                return;
            }

            if (cleanPassword.length < 6) {
                alert('パスワードは6文字以上必要です');
                return;
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword,
                }),
            });

            let data: any = {};

            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                if (res.status === 409) {
                    alert('このメールアドレスは既に登録されています');
                    return;
                } else if (res.status === 429) {
                    alert('このメールアドレスには認証メールが送信されています。\nしばらくしてから再度お試しください。');
                    return;
                }

                alert(data?.error || '登録に失敗しました');
                return;
            }

            alert('認証メールを送信しました');

            location.href =
                `/verify-email-sent?email=${encodeURIComponent(cleanEmail)}&status=${data.status}`;

        } catch (err: any) {
            console.error(err);
            alert(err.message || '登録に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // Google登録
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);

            // ① Google認証
            const provider = new GoogleAuthProvider();

            provider.setCustomParameters({
                prompt: 'select_account',
            });

            const result = await signInWithPopup(auth, provider);

            // ② Firebase IDトークン取得
            const idToken = await result.user.getIdToken();

            // ③ 自社APIへ送信
            const res = await fetch('/api/auth/googleRegister', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken,
                }),
            });

            // ④ レスポンス取得
            let data: any = {};

            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) {
                throw new Error(
                    data?.error || 'Google登録に失敗しました'
                );
            }

            // ⑤ 登録成功
            alert('登録が完了しました！\nログイン画面からログインしてください。');

            location.href = '/login';

        } catch (err: any) {
            console.error('Google登録エラー:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                alert('Google認証がキャンセルされました');
            } else if (err.code === 'auth/popup-blocked') {
                alert('ポップアップがブロックされています');
            } else {
                alert(err.message || 'Google登録に失敗しました');
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">

            {/* ヘッダー */}
            <header className="w-full bg-[#1760f5] shadow-md">
                <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">

                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white font-bold hover:opacity-80 transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="21"
                            height="21"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m3 10 9-7 9 7" />
                            <path d="M5 9v12h14V9" />
                            <path d="M9 21v-8h6v8" />
                        </svg>

                        <span>ホーム</span>
                    </Link>

                </div>
            </header>

            {/* 新規登録画面 */}
            <main className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 sm:px-6 py-10">

                <div className="w-full max-w-sm sm:max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">

                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        新規登録
                    </h1>

                    <p className="text-sm text-gray-500 text-center mb-6">
                        アカウントを作成して合コンを楽しもう！
                    </p>

                    {/* メールアドレス登録 */}
                    <div className="space-y-4">

                        <input
                            type="email"
                            placeholder="メールアドレス"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Gmail利用者への案内 */}
                        <p className="text-xs text-gray-500">
                            ※ Gmail（@gmail.com）をご利用の場合は、
                            「Googleで登録」からご登録ください。
                        </p>

                        <input
                            type="password"
                            placeholder="パスワード（6文字以上）"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleEmailRegister}
                            disabled={loading}
                            className="w-full bg-[#1760f5] text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                        >
                            {loading ? '登録中...' : 'メールアドレスで登録'}
                        </button>

                    </div>

                    {/* 区切り線 */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-300" />

                        <span className="px-3 text-sm text-gray-500">
                            または
                        </span>

                        <div className="flex-1 border-t border-gray-300" />
                    </div>

                    {/* Google登録 */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? '登録中...' : 'Googleで登録'}
                    </button>

                    {/* ログインへの案内 */}
                    <div className="text-center mt-7 text-sm text-gray-600">
                        すでにアカウントをお持ちの方は
                        <br />
                        <Link
                            href="/login"
                            className="text-blue-600 font-semibold hover:underline mt-2 inline-block"
                        >
                            ログインはこちら
                        </Link>
                    </div>

                </div>

            </main>

        </div>
    );
}
