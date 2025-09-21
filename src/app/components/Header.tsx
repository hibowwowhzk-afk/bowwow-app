// components/Header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Cog6ToothIcon } from '@heroicons/react/24/outline'; // 既に導入済みならOK

export default function Header() {
    const { profile, setProfile } = useUserStore();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (profile) return;

        const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/getProfileInfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
            throw new Error('プロフィール取得に失敗しました');
            }
            const data = await res.json();
            setProfile(data.profile);
        } catch (err: any) {
            setError(err.message);
        }
        };

        fetchProfile();
    }, [profile, setProfile]);

    return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-blue-600 text-white shadow-md">
        <div
            className="text-lg font-bold truncate cursor-pointer"
            onClick={() => router.push('/dashboard')}
            title="ダッシュボードへ"
        >
            ダッシュボード
        </div>
        <div className="flex items-center space-x-3">
            <span className="text-sm truncate max-w-[100px]">{profile?.display_name || 'ゲスト'}</span>
            <Cog6ToothIcon
            className="w-6 h-6 cursor-pointer"
            onClick={() => router.push('/settings')}
            title="設定"
            />
            <img
            // src="/default-avatar.png"
            alt="ユーザーアイコン"
            className="w-8 h-8 rounded-full border-2 border-white"
            />
        </div>
        {error && (
            <div className="absolute top-0 left-0 right-0 text-red-500 text-sm text-center bg-white py-1 shadow">
            {error}
            </div>
        )}
        </header>
    );
}