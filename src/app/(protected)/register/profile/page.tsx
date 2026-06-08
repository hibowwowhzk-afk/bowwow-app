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

    // 選択中の画像ファイル
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    // 画像削除フラグ
    const [removeImage, setRemoveImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hydration対策
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * プロフィール取得
     */
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/getProfileInfo', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!res.ok) throw new Error('プロフィール取得に失敗しました');
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

    /**
     * 入力変更
     */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: name === 'age' ? Number(value) : value,
        }));
    };

    /**
     * 画像選択（アップロードは保存時）
     */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        setProfile(prev => ({
            ...prev,
            image_url: previewUrl,
        }));

        setSelectedImageFile(file);
        setRemoveImage(false);
    };

    /**
     * 画像削除
     */
    const handleRemoveImage = () => {
        setProfile(prev => ({
            ...prev,
            image_url: '',
        }));
        setSelectedImageFile(null);
        setRemoveImage(true);
    };

    /**
     * 保存
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const formData = new FormData();

            // ★ API 側で直接 get するキーに合わせる
            formData.append('display_name', profile.display_name);
            formData.append('age', String(profile.age));
            formData.append('residence', profile.residence);
            formData.append('occupation', profile.occupation);
            formData.append('message', profile.message);

            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
                formData.append('imageChanged', '1');
            }

            if (removeImage) {
                formData.append('imageChanged', '1');
                formData.append('imageDeleted', '1');
            }

            const res = await fetch('/api/user/updateProfile', {
                method: 'POST',
                body: formData,
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
    if (!mounted) return null;

    return (
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

                <div className="flex gap-2 mt-3">
                    <button
                        type="button"
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        画像を変更
                    </button>

                    {profile.image_url && (
                        <button
                            type="button"
                            className="px-3 py-1 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded"
                            onClick={handleRemoveImage}
                        >
                            画像を削除
                        </button>
                    )}
                </div>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-semibold mb-1">表示名</label>
                    <input
                        name="display_name"
                        value={profile.display_name}
                        onChange={handleChange}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-1">年齢</label>
                    <input
                        type="number"
                        name="age"
                        value={profile.age}
                        onChange={handleChange}
                        min={0}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-1">住居地</label>
                    <input
                        name="residence"
                        value={profile.residence}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-1">職業</label>
                    <input
                        name="occupation"
                        value={profile.occupation}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-semibold mb-1">メッセージ</label>
                    <textarea
                        name="message"
                        value={profile.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    保存
                </button>
            </form>
        </div>
    );
}
