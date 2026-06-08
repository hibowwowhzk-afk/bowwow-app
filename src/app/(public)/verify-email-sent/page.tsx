'use client';

import { useState } from 'react';

export default function VerifyEmailSentPage() {
    const [loading, setLoading] = useState(false);

    const params =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;

    const email = params?.get('email') ?? '';
    const status = params?.get('status');

    const isPending = status === 'PENDING_VERIFICATION';

    const handleResend = async () => {
        try {
            setLoading(true);

            const res = await fetch('/api/auth/resendVerification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || '再送に失敗しました');
                return;
            }

            alert('認証メールを再送しました');

        } catch (err) {
            console.error(err);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">
                {isPending
                    ? '認証メールを再送しました'
                    : '認証メールを送信しました'}
            </h1>

            <p className="text-gray-600 mb-6">
                {email && (
                    <>
                        <span className="font-semibold">{email}</span>

                        {isPending ? (
                            <>
                                に認証メールを再送しました。
                            </>
                        ) : (
                            <>
                                に認証メールを送信しました。
                            </>
                        )}
                    </>
                )}
            </p>

            <div className="space-y-3">
                <p className="text-sm text-gray-500">
                    メール内のリンクをクリックして登録を完了してください。
                </p>

                {isPending && (
                    <p className="text-sm text-amber-600">
                        初回登録時に設定したパスワードが有効です。
                    </p>
                )}

                <p className="text-sm text-gray-500">
                    メールが届かない場合は迷惑メールフォルダをご確認ください。
                </p>

                <button
                    onClick={handleResend}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
                >
                    {loading ? '送信中...' : '認証メールを再送'}
                </button>

                <a
                    href="/register"
                    className="block text-sm text-gray-500 underline"
                >
                    登録画面に戻る
                </a>
            </div>
        </div>
    );
}