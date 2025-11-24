// src/app/settings/page.tsx
'use client';

export default function SettingsPage() {
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
                <div className="font-semibold text-blue-600">プロフィール編集</div>
                <div className="text-sm text-gray-500">表示名・年齢・職業などのプロフィールを編集できます。</div>
                </a>
            </li>

            {/* 他の設定項目を追加したい場合は以下に */}
            {/* <li>
                <a href="/settings/notifications" className="block p-4 bg-white shadow rounded-md hover:bg-blue-50 transition">
                <div className="font-semibold text-blue-600">通知設定</div>
                <div className="text-sm text-gray-500">通知のオン・オフを切り替えます。</div>
                </a>
            </li> */}
            </ul>
        </main>
        </div>
    );
}