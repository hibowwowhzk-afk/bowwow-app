
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useUserStore } from '@/store/userStore';

type ApiResponse = {
    user: {
        user_id: number;
        authority: number;
    };
    profile: {
        is_profile_completed: number;
    };
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const setUser = useUserStore((state) => state.setUser);
    const setProfile = useUserStore((state) => state.setProfile);

    // ログイン後の共通処理
    async function completeLogin(idToken: string) {

        // ① セッション作成
        const sessionRes = await fetch('/api/session/loginSession', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        if (!sessionRes.ok) {
            const errorData = await sessionRes.json();
            throw new Error(
                errorData.error || 'セッション設定に失敗しました'
            );
        }

        // ② 最終ログイン日時を更新
        const activityRes = await fetch('/api/user/activity/login', {
            method: 'POST',
            credentials: 'include',
        });

        if (!activityRes.ok) {
            throw new Error('最終ログイン日時の更新に失敗しました');
        }

        // ③ ユーザー情報取得
        const res = await fetch('/api/user/getUserInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('ユーザー情報の取得に失敗しました');
        }

        const data: ApiResponse = await res.json();

        // ④ Zustandに保存
        setUser(data.user);
        setProfile(data.profile);

        // ⑤ 画面遷移
        if (
            !data.profile ||
            Number(data.profile.is_profile_completed) === 0
        ) {
            router.push('/register/profile/first');
        } else {
            router.push('/home');
        }
    }

    // メールアドレス・パスワードログイン
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const idToken = await credential.user.getIdToken();

            await completeLogin(idToken);

        } catch (err: any) {
            console.error('LOGIN_ERROR:', err);

            setError(
                err.message || 'ログイン処理中にエラーが発生しました'
            );
        } finally {
            setLoading(false);
        }
    }

    // Googleログイン
    async function handleGoogleLogin() {
        setError(null);
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();

            provider.setCustomParameters({
                prompt: 'select_account',
            });

            // ① Google認証
            const credential = await signInWithPopup(auth, provider);

            // ② IDトークン取得
            const idToken = await credential.user.getIdToken();

            // ③ 既存のログイン処理へ合流
            await completeLogin(idToken);

        } catch (err: any) {
            console.error('GOOGLE_LOGIN_ERROR:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                setError('Googleログインがキャンセルされました');
            } else if (err.code === 'auth/popup-blocked') {
                setError('ポップアップがブロックされました');
            } else {
                setError(
                    err.message || 'Googleログインに失敗しました'
                );
            }
        } finally {
            setLoading(false);
        }
    }

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

            {/* ログイン画面 */}
            <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 sm:px-6 py-10">

                <div className="w-full max-w-sm sm:max-w-md bg-white shadow-lg rounded-2xl p-6 sm:p-8">

                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                        ログイン
                    </h1>

                    {/* メールアドレス・パスワードログイン */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <input
                            type="email"
                            placeholder="メールアドレス"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="password"
                            placeholder="パスワード"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                パスワードを忘れた方はこちら
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1760f5] text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                        >
                            {loading ? '処理中...' : 'ログイン'}
                        </button>

                    </form>

                    {/* 区切り線 */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-300" />

                        <span className="px-3 text-sm text-gray-500">
                            または
                        </span>

                        <div className="flex-1 border-t border-gray-300" />
                    </div>

                    {/* Googleログイン */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-md font-semibold hover:bg-gray-50 transition duration-200 disabled:opacity-50"
                    >
                        Googleでログイン
                    </button>

                    {/* エラー表示 */}
                    {error && (
                        <p className="mt-4 text-center text-red-600 text-sm">
                            {error}
                        </p>
                    )}

                </div>
            </div>

        </div>
    );
}
