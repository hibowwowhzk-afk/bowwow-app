'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Cog6ToothIcon, HomeIcon } from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

export default function Header() {
    const { profile, setProfile } = useUserStore();
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false); // クライアントマウント確認
    const router = useRouter();

    useEffect(() => {
        setMounted(true); // クライアント側でマウントされたら true
    }, []);

    useEffect(() => {
        if (profile) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/getProfileInfo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!res.ok) throw new Error('プロフィール取得に失敗しました');
                const data = await res.json();
                setProfile(data.profile);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchProfile();
    }, [profile, setProfile]);

    // サーバーとクライアントで HTML を一致させる
    const displayName = profile?.display_name ?? 'ゲスト';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-blue-600 text-white shadow-md">
            {/* ホームボタン */}
            <div
                className="flex items-center space-x-2 cursor-pointer hover:bg-blue-700 px-3 py-1 rounded-md transition"
                onClick={() => router.push('/auth/home')}
                title="ホームへ"
            >
                <HomeIcon className="w-5 h-5" />
                <span className="font-bold text-lg">ホームへ</span>
            </div>

            {/* 右側メニュー（通知・名前・設定） */}
            <div className="flex items-center space-x-3">
                {mounted && <NotificationBell />} {/* クライアントマウント後にのみ表示 */}
                <span className="text-sm truncate max-w-[100px]">{displayName}</span>
                <Cog6ToothIcon
                    className="w-6 h-6 cursor-pointer hover:text-gray-200"
                    onClick={() => router.push('/auth/settings')}
                    title="設定"
                />
            </div>

            {/* エラーメッセージ */}
            {error && (
                <div className="absolute top-0 left-0 right-0 text-red-500 text-sm text-center bg-white py-1 shadow">
                    {error}
                </div>
            )}
        </header>
    );
}
