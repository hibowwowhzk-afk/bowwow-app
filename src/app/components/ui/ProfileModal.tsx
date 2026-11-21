
'use client';

import React, { useEffect, useState } from 'react';

import {
    XMarkIcon,
    MapPinIcon,
    BriefcaseIcon,
    CakeIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

type ProfileModalSource =
    | 'requests'
    | 'matches';

type UserProfile = {
    user_id: number;
    display_name: string;
    age: number;
    residence: string;
    occupation: string;
    message: string;
    image_url: string | null;
};

type ProfileModalProps = {
    userId: number | null;
    isOpen: boolean;
    onClose: () => void;
    source?: ProfileModalSource;
};

export default function ProfileModal({
    userId,
    isOpen,
    onClose,
    source = 'requests',
}: ProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId || !isOpen) return;

        const controller = new AbortController();

        async function fetchProfile() {
            try {
                setLoading(true);
                setProfile(null);
                setError(null);

                const res = await fetch(
                    `/api/user/${userId}/getProfiles?source=${source}`,
                    { signal: controller.signal }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(
                        data.error || 'プロフィール取得に失敗しました'
                    );
                }

                setProfile(data.profile);
            } catch (e) {
                if ((e as Error).name === 'AbortError') return;

                console.error(e);
                setError(
                    (e as Error).message ||
                    'プロフィール取得に失敗しました'
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchProfile();

        return () => {
            controller.abort();
        };
    }, [userId, isOpen, source]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-modal-title"
                className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
                {/* ヘッダー */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2
                            id="profile-modal-title"
                            className="text-lg font-bold text-slate-900"
                        >
                            プロフィール
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            相手のプロフィールを確認できます
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="overflow-y-auto overscroll-contain p-5">
                    {/* 読み込み中 */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                            <p className="mt-4 text-sm text-slate-500">
                                プロフィールを読み込んでいます...
                            </p>
                        </div>
                    )}

                    {/* エラー */}
                    {!loading && error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center"
                        >
                            <p className="text-sm font-medium text-red-600">
                                {error}
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-4 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
                            >
                                閉じる
                            </button>
                        </div>
                    )}

                    {/* プロフィール */}
                    {!loading && !error && profile && (
                        <div className="space-y-6">
                            {/* プロフィール画像・名前 */}
                            <div className="flex flex-col items-center pt-2">
                                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-blue-50 shadow-md ring-1 ring-slate-100">
                                    {profile.image_url ? (
                                        <img
                                            src={profile.image_url}
                                            alt={`${profile.display_name}のプロフィール画像`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-blue-400">
                                            {profile.display_name ? (
                                                <span className="text-4xl font-bold">
                                                    {profile.display_name[0]}
                                                </span>
                                            ) : (
                                                <UserCircleIcon className="h-16 w-16" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h3 className="mt-4 text-xl font-bold text-slate-900">
                                    {profile.display_name}
                                </h3>
                            </div>

                            {/* 基本情報 */}
                            <section>
                                <h4 className="mb-3 text-sm font-bold text-slate-900">
                                    基本情報
                                </h4>

                                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70 px-4">
                                    <div className="flex items-center gap-3 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <CakeIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-xs text-slate-400">
                                                年齢
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                                {profile.age
                                                    ? `${profile.age}歳`
                                                    : '未設定'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <MapPinIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-xs text-slate-400">
                                                居住地
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                                {profile.residence || '未設定'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 py-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <BriefcaseIcon className="h-5 w-5" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-xs text-slate-400">
                                                職業
                                            </p>
                                            <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                                {profile.occupation || '未設定'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 自己紹介 */}
                            <section>
                                <h4 className="mb-3 text-sm font-bold text-slate-900">
                                    自己紹介
                                </h4>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                        {profile.message || '自己紹介はありません'}
                                    </p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
