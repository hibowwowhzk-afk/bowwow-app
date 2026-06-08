'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

type Profile = {
    display_name: string;
    age: number;
    gender: 'male' | 'female' | '';
    residence: string;
    occupation: string;
    message: string;
    image_url?: string;
};

export default function ProfileFirstRegisterPage() {
    const router = useRouter();
    const { setProfile: setGlobalProfile } = useUserStore();

    const [profile, setProfile] = useState<Profile>({
        display_name: '',
        age: 18,
        gender: '',
        residence: '',
        occupation: '',
        message: '',
        image_url: '',
    });

    const [error, setError] = useState<string | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
     * 画像選択
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
    };

    /**
     * 保存（新規登録）
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!profile.display_name) {
            setError('表示名は必須です');
            return;
        }

        if (profile.age < 18) {
            setError('18歳未満は利用できません');
            return;
        }

        if (!profile.gender) {
            setError('性別を選択してください');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('display_name', profile.display_name);
            formData.append('age', String(profile.age));
            formData.append('gender', profile.gender); // 追加
            formData.append('residence', profile.residence);
            formData.append('occupation', profile.occupation);
            formData.append('message', profile.message);
            
            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
                formData.append('imageChanged', '1'); // フラグを必ず追加
            }

            const res = await fetch('/api/user/createProfile', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                setError(errorData.error || 'プロフィール登録に失敗しました');
                return;
            }

            setGlobalProfile(profile);
            alert('プロフィールを登録しました');

            router.push('/home');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-2xl font-bold mb-2">プロフィールを登録しましょう</h1>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {/* 画像 */}
            <div className="flex flex-col items-center mb-6">
                {profile.image_url ? (
                    <img
                        src={profile.image_url}
                        alt="プロフィール画像"
                        className="w-32 h-32 rounded-full object-cover shadow"
                    />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center shadow">
                        <span className="text-gray-500 text-sm">任意</span>
                    </div>
                )}

                <button
                    type="button"
                    className="mt-3 px-3 py-1 text-sm bg-gray-200 rounded"
                    onClick={() => fileInputRef.current?.click()}
                >
                    画像を選択
                </button>

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
                    <label className="font-semibold">表示名（必須）</label>
                    <input
                        name="display_name"
                        value={profile.display_name}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="font-semibold">年齢（18歳以上）</label>
                    <input
                        type="number"
                        name="age"
                        value={profile.age}
                        onChange={handleChange}
                        min={18}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                </div>

                <div>
                    <label className="font-semibold">性別（必須）</label>
                    <div className="flex gap-4 mt-1">
                        <label>
                            <input
                                type="radio"
                                name="gender"
                                value="male"
                                checked={profile.gender === 'male'}
                                onChange={handleChange}
                            />
                            男性
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="gender"
                                value="female"
                                checked={profile.gender === 'female'}
                                onChange={handleChange}
                            />
                            女性
                        </label>
                    </div>
                </div>

                <div>
                    <label className="font-semibold">住居地</label>
                    <input
                        name="residence"
                        value={profile.residence}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="font-semibold">職業</label>
                    <input
                        name="occupation"
                        value={profile.occupation}
                        onChange={handleChange}
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="font-semibold">自己紹介</label>
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
                    プロフィールを登録する
                </button>
            </form>
        </div>
    );
}
