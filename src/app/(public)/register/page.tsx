'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailRegister = async () => {
        try {
            setLoading(true);

            const cleanEmail = email.trim();
            const cleanPassword = password.trim();

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

            // JSONパース（安全版）
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
                } else if(res.status === 429) {
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

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();

            await signInWithPopup(auth, provider);

            location.href = '/profile/register';
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">
                新規登録
            </h1>

            <div className="space-y-4">
                <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />

                <input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                />

                <button
                    onClick={handleEmailRegister}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded"
                >
                    {loading ? '登録中...' : 'メールアドレスで登録'}
                </button>
            </div>

            <div className="my-6 text-center text-gray-500">
                または
            </div>

            <button
                onClick={handleGoogleLogin}
                className="w-full border py-2 rounded"
            >
                Googleで登録
            </button>
        </div>
    );
}