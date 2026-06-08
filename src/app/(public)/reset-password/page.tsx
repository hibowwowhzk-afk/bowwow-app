'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        try {
            setError(null);

            if (!password || password.length < 6) {
                setError('パスワードは6文字以上です');
                return;
            }

            if (password !== confirm) {
                setError('パスワードが一致しません');
                return;
            }

            setLoading(true);

            const res = await fetch('/api/auth/resetPassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '失敗しました');
                return;
            }

            setSuccess(true);

            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto p-6 text-center">
                <h1 className="text-xl font-bold text-green-600">
                    パスワードを更新しました
                </h1>
                <p className="mt-2 text-gray-500">
                    ログイン画面に移動します...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                パスワード再設定
            </h1>

            <input
                type="password"
                placeholder="新しいパスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 mb-3"
            />

            <input
                type="password"
                placeholder="確認用パスワード"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border p-2 mb-3"
            />

            {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2"
            >
                {loading ? '更新中...' : 'パスワードを更新'}
            </button>
        </div>
    );
}