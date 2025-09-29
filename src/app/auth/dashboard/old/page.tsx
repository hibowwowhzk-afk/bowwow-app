'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

export default function DashboardHeader() {
    const { userData } = useUserStore();
    const [profile, setProfile] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
        if (!userData?.user?.user_id) {
            setError('ユーザーIDが見つかりません');
            return;
        }

        try {
            const res = await fetch('/api/user/getProfileInfo', {
                method: 'POST',
                body: JSON.stringify({ userData }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('プロフィールの取得に失敗しました');
            }

            const result = await res.json();
            setProfile(result.profile);
        } catch (err: any) {
            setError(err.message);
        }
        };

        fetchProfile();
    }, [userData]);

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shadow-md">
        {/* ハンバーガーメニュー */}
        <button
            aria-label="メニューを開く"
            className="p-2 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
        >
            <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
        </button>

        {/* ロゴ */}
        <div className="text-lg font-bold truncate">ダッシュボード</div>

        {/* ユーザー名＆アイコン */}
        <div className="flex items-center space-x-3">
            <span className="text-sm truncate max-w-[100px]">
            {profile?.display_name || userData?.user?.name || 'ゲスト'}
            </span>
            <img
            src={profile?.avatar_url || userData?.user?.avatarUrl || '/default-avatar.png'}
            alt="ユーザーアイコン"
            className="w-8 h-8 rounded-full border-2 border-white"
            />
        </div>

        {/* エラー表示 */}
        {error && (
            <div className="absolute top-0 left-0 right-0 text-red-500 text-sm text-center bg-white py-1 shadow">
            {error}
            </div>
        )}
        </header>
    );
}