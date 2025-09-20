// src/app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

    const router = useRouter();
    const setUser = useUserStore((state) => state.setUser);
    const setProfile = useUserStore((state) => state.setProfile);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!auth) {
        setError('認証機能が初期化できていません');
        return;
        }

        try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();

        const sessionRes = await fetch('/api/session/loginSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!sessionRes.ok) {
            const errorData = await sessionRes.json();
            setError(errorData.error || 'セッション設定に失敗しました');
            return;
        }

        const res = await fetch('/api/user/getUserInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
            const errorData = await res.json();
            setError(errorData.error || 'ユーザー情報取得に失敗しました');
            return;
        }

        const data: ApiResponse = await res.json();
        setUser(data.user);
        setProfile(data.profile);

        if (data.profile.is_profile_completed === 0) {
            router.push('/register/profile');
        } else {
            router.push('/dashboard');
        }
        } catch (err: any) {
        setError(err.message || 'ログイン処理中にエラーが発生しました');
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
                ログイン
            </button>
            </form>

            {error && (
            <p className="mt-4 text-center text-red-600 text-sm">{error}</p>
            )}
        </div>
        </div>
    );
}