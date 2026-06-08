'use client';

import React, { useEffect, useState } from 'react';

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

export default function ProfileModal({ userId, isOpen, onClose, source}: ProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !isOpen) return;

        async function fetchProfile() {
            try {
                const res = await fetch(`/api/user/${userId}/getProfiles?source=${source}`);
                const data = await res.json();
                if (res.ok) setProfile(data.profile);
                else throw new Error('プロフィール取得に失敗しました');
            } catch (e) {
                setError((e as Error).message);
            }
        }

        fetchProfile();
    }, [userId, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-200 scale-100 hover:scale-105"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-2xl font-semibold text-gray-800">プロフィール</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                    >
                        ✕
                    </button>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {!profile ? (
                    <p className="text-gray-500 text-center">読み込み中...</p>
                ) : (
                    <div className="space-y-5">
                        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg">
                            {profile.image_url ? (
                                <img
                                    src={profile.image_url}
                                    alt={profile.display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-bold text-4xl">
                                    {profile.display_name[0]}
                                </div>
                            )}
                        </div>

                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-gray-900">{profile.display_name}</h3>
                            <p className="text-sm text-gray-600">年齢: {profile.age}</p>
                            <p className="text-sm text-gray-600">居住地: {profile.residence}</p>
                            <p className="text-sm text-gray-600">職業: {profile.occupation}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md shadow-inner">
                            <p className="text-sm text-blue-700 font-medium mb-1">メッセージ</p>
                            <p className="text-sm text-gray-700">{profile.message || 'なし'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
