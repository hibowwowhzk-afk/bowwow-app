'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RegisterPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (value: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value);
    };

    const handleRegister = async () => {
        setError('');

        // 入力チェック
        if (!email || !password || !confirmPassword) {
            setError('すべて入力してください');
            return;
        }

        if (!validateEmail(email)) {
            setError('正しいメールアドレス形式で入力してください');
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上にしてください');
            return;
        }

        if (password !== confirmPassword) {
            setError('パスワードが一致しません');
            return;
        }

        try {
            setLoading(true);

            // Firebase登録
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const uid = userCredential.user.uid;

            // MySQL登録
            await fetch('/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid,
                    email,
                }),
            });

            router.push('/login');
        } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
                setError('このメールアドレスは既に登録されています');
            } else if (e.code === 'auth/invalid-email') {
                setError('メールアドレスが不正です');
            } else if (e.code === 'auth/weak-password') {
                setError('パスワードが弱すぎます');
            } else {
                setError('登録に失敗しました');
            }
        } finally {
            setLoading(false);
        }
    };

    const isMatch =
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword;

    return (
        <main className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
                <h1 className="text-2xl font-bold mb-6 text-center">新規登録</h1>

                <div className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="メールアドレス"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 rounded"
                    />

                    <input
                        type="password"
                        placeholder="パスワード"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 rounded"
                    />

                    <input
                        type="password"
                        placeholder="パスワード（確認）"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border p-2 rounded"
                    />

                    {confirmPassword && (
                        <p className={`text-sm ${isMatch ? 'text-green-600' : 'text-red-500'}`}>
                            {isMatch ? 'パスワードが一致しています' : 'パスワードが一致していません'}
                        </p>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        onClick={handleRegister}
                        disabled={loading || !isMatch}
                        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? '登録中...' : '登録する'}
                    </button>
                </div>
            </div>
        </main>
    );
}
