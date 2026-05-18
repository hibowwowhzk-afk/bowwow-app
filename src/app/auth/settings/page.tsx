// src/app/settings/page.tsx
'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // ① Firebaseログアウト
            await signOut(auth);

            // ② サーバーセッション削除
            await fetch('/api/session/logoutSession', {
                method: 'POST',
            });

            alert('ログアウトしました');

            router.push('/login');
        } catch (error) {
            console.error(error);
            alert('ログアウトに失敗しました');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <main className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">設定一覧</h1>

                <ul className="space-y-4">
                    <li>
                        <a
                            href="/auth/register/profile"
                            className="block p-4 bg-white shadow rounded-md hover:bg-blue-50 transition"
                        >
                            <div className="font-semibold text-blue-600">
                                プロフィール編集
                            </div>
                            <div className="text-sm text-gray-500">
                                表示名・年齢・職業などのプロフィールを編集できます。
                            </div>
                        </a>
                    </li>

                    {/* ログアウト */}
                    <li>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left p-4 bg-white shadow rounded-md hover:bg-red-50 transition"
                        >
                            <div className="font-semibold text-red-600">
                                ログアウト
                            </div>
                            <div className="text-sm text-gray-500">
                                現在のアカウントからログアウトします。
                            </div>
                        </button>
                    </li>
                </ul>
            </main>
        </div>
    );
}