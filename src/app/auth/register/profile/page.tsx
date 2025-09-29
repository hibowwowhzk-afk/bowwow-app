'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useUserStore } from '@/store/userStore';

type Profile = {
    display_name: string;
    age: number;
    residence: string;
    occupation: string;
    message: string;
    image_url?: string;
};

export default function ProfileRegisterPage() {
    const { setProfile: setGlobalProfile } = useUserStore();
    const [profile, setProfile] = useState<Profile>({
        display_name: '',
        age: 0,
        residence: '',
        occupation: '',
        message: '',
        image_url: '',
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ファイル選択用のinputを隠して使う
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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

            const fetchedProfile: Profile = {
            display_name: data.profile.display_name || '',
            age: data.profile.age || 0,
            residence: data.profile.residence || '',
            occupation: data.profile.occupation || '',
            message: data.profile.message || '',
            image_url: data.profile.image_url || '',
            };

            setProfile(fetchedProfile);
            setGlobalProfile(fetchedProfile);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        };

        fetchProfile();
    }, [setGlobalProfile]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
        ...prev,
        [name]: name === 'age' ? Number(value) : value,
        }));
    };

    // ファイル選択処理
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        const previewUrl = URL.createObjectURL(file);
        setProfile((prev) => ({ ...prev, image_url: previewUrl }));
        // TODO: アップロード処理を追加してサーバーに保存する
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
        const res = await fetch('/api/user/updateProfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
        });

        if (!res.ok) {
            const errorData = await res.json();
            setError(errorData.error || 'プロフィール更新に失敗しました');
            return;
        }

        setGlobalProfile(profile);

        alert('プロフィールを更新しました');
        } catch (err: any) {
        setError(err.message);
        }
    };

    if (loading) return <p>読み込み中...</p>;

    return (
        <div>
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-xl font-bold mb-4">プロフィール編集</h1>
            {error && <p className="text-red-600 mb-4">{error}</p>}

            {/* プロフィール画像 */}
            <div className="flex flex-col items-center mb-6">
            {profile.image_url ? (
                <img
                src={profile.image_url}
                alt="プロフィール画像"
                className="w-32 h-32 rounded-full object-cover shadow"
                />
            ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center shadow">
                <span className="text-gray-500 text-sm">No Image</span>
                </div>
            )}
            <button
                type="button"
                className="mt-3 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                onClick={() => fileInputRef.current?.click()}
            >
                画像を変更
            </button>
            {/* 非表示のファイル入力 */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="display_name" className="block font-semibold mb-1">
                表示名
                </label>
                <input
                type="text"
                id="display_name"
                name="display_name"
                value={profile.display_name}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
                />
            </div>

            <div>
                <label htmlFor="age" className="block font-semibold mb-1">
                年齢
                </label>
                <input
                type="number"
                id="age"
                name="age"
                value={profile.age}
                onChange={handleChange}
                required
                min={0}
                className="w-full border px-3 py-2 rounded"
                />
            </div>

            <div>
                <label htmlFor="residence" className="block font-semibold mb-1">
                住居地
                </label>
                <input
                type="text"
                id="residence"
                name="residence"
                value={profile.residence}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                />
            </div>

            <div>
                <label htmlFor="occupation" className="block font-semibold mb-1">
                職業
                </label>
                <input
                type="text"
                id="occupation"
                name="occupation"
                value={profile.occupation}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                />
            </div>

            <div>
                <label htmlFor="message" className="block font-semibold mb-1">
                メッセージ
                </label>
                <textarea
                id="message"
                name="message"
                value={profile.message}
                onChange={handleChange}
                rows={4}
                className="w-full border px-3 py-2 rounded"
                />
            </div>

            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                保存
            </button>
            </form>
        </div>
        </div>
    );
}