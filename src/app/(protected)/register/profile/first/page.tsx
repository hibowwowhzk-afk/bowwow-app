
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
    x_account: string;
    instagram_account: string;
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
        x_account: '',
        instagram_account: '',
        image_url: '',
    });

    // 年齢入力専用のstate。入力中は文字列で管理する
    const [ageInput, setAgeInput] = useState('');

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
            [name]: value,
        }));
    };

    /**
     * 年齢入力変更
     */
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 空欄もそのまま保持する
        setAgeInput(e.target.value);
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

        // 表示名チェック
        if (!profile.display_name.trim()) {
            setError('表示名は必須です');
            return;
        }

        // 年齢チェック
        const age = Number(ageInput);

        if (
            !ageInput.trim() ||
            !Number.isInteger(age) ||
            age < 18 ||
            age > 100
        ) {
            setError('年齢は18歳以上100歳以下で入力してください');
            return;
        }

        // 性別チェック
        if (!profile.gender) {
            setError('性別を選択してください');
            return;
        }

        // SNSアカウントチェック
        // XまたはInstagramのどちらか一方は必須
        if (
            !profile.x_account.trim() &&
            !profile.instagram_account.trim()
        ) {
            setError('XまたはInstagramのアカウントを入力してください');
            return;
        }

        try {
            const formData = new FormData();

            formData.append('display_name', profile.display_name);
            formData.append('age', String(age));
            formData.append('gender', profile.gender);
            formData.append('residence', profile.residence);
            formData.append('occupation', profile.occupation);
            formData.append('message', profile.message);

            // SNSアカウント
            formData.append('x_account', profile.x_account.trim());
            formData.append('instagram_account', profile.instagram_account.trim());

            // 画像
            if (selectedImageFile) {
                formData.append('image', selectedImageFile);
                formData.append('imageChanged', '1');
            }

            const res = await fetch('/api/user/createProfile', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();

                setError(
                    errorData.error || 'プロフィール登録に失敗しました'
                );
                return;
            }

            // グローバルストアには数値として保存
            setGlobalProfile({
                ...profile,
                age,
            });

            alert('プロフィールを登録しました');

            router.push('/home');

        } catch (err: any) {
            console.error(err);

            setError(
                err.message || 'プロフィール登録に失敗しました'
            );
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-white text-gray-900 min-h-screen">

            <h1 className="text-2xl font-bold mb-2 text-gray-900">
                プロフィールを登録しましょう
            </h1>

            {error && (
                <p className="text-red-600 mb-4">
                    {error}
                </p>
            )}

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
                        <span className="text-gray-600 text-sm">
                            任意
                        </span>
                    </div>
                )}

                <button
                    type="button"
                    className="mt-3 px-3 py-1 text-sm bg-gray-200 text-gray-900 rounded"
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

                {/* 表示名 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        表示名（必須）
                    </label>

                    <input
                        type="text"
                        name="display_name"
                        value={profile.display_name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                        required
                    />
                </div>

                {/* 年齢 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        年齢（18歳以上）
                    </label>

                    <input
                        type="number"
                        name="age"
                        value={ageInput}
                        onChange={handleAgeChange}
                        min="18"
                        max="100"
                        step="1"
                        inputMode="numeric"
                        placeholder="年齢を入力"
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                        required
                    />
                </div>

                {/* 性別 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        性別（必須）
                    </label>

                    <div className="flex gap-4 mt-1 text-gray-900">
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

                {/* 住居地 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        住居地
                    </label>

                    <input
                        type="text"
                        name="residence"
                        value={profile.residence}
                        onChange={handleChange}
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                    />
                </div>

                {/* 職業 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        職業
                    </label>

                    <input
                        type="text"
                        name="occupation"
                        value={profile.occupation}
                        onChange={handleChange}
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                    />
                </div>

                {/* 自己紹介 */}
                <div>
                    <label className="font-semibold text-gray-900">
                        自己紹介
                    </label>

                    <textarea
                        name="message"
                        value={profile.message}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                    />
                </div>

                {/* Xアカウント */}
                <div>
                    <label className="font-semibold text-gray-900">
                        Xアカウント名
                    </label>

                    <input
                        type="text"
                        name="x_account"
                        value={profile.x_account}
                        onChange={handleChange}
                        placeholder="@username"
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                    />
                </div>

                {/* Instagramアカウント */}
                <div>
                    <label className="font-semibold text-gray-900">
                        Instagramアカウント名
                    </label>

                    <input
                        type="text"
                        name="instagram_account"
                        value={profile.instagram_account}
                        onChange={handleChange}
                        placeholder="username"
                        className="w-full border border-gray-300 bg-white text-gray-900 px-3 py-2 rounded"
                    />
                </div>

                {/* SNS入力ルール */}
                <p className="text-sm text-red-600">
                    ※ XまたはInstagramのどちらか一方は必須です。
                </p>

                {/* 登録ボタン */}
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
