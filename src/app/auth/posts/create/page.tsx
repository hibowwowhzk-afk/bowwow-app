'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ErrorState = {
    message: string;
    type?: 'limit' | 'kyc' | 'normal';
} | null;

export default function CreatePostPage() {
    const router = useRouter();
    const [date, setDate] = useState('');
    const [message, setMessage] = useState('');
    const [isImmediate, setIsImmediate] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [error, setError] = useState<ErrorState>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userAge = 28;
    const numPeople = 2;
    const locationExample = '博多駅周辺';
    const exampleMessage = `例: 場所: ${locationExample}、人数: ${numPeople}人、年齢: 自分たち ${userAge}歳`;

    useEffect(() => {
        if (isImmediate) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);
        } else {
            setDate('');
        }
    }, [isImmediate]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).slice(0, 2);
            setImages(filesArray);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (isSubmitting) return;
        setIsSubmitting(true);

        if (!message.trim()) {
            setError({
                type: 'normal',
                message: 'メッセージは必須です',
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('date', date);
            formData.append('message', message);
            formData.append('isImmediate', isImmediate ? '1' : '0');
            images.forEach((img) => formData.append('images', img));

            const res = await fetch('/api/posts/create', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            // =========================
            // KYC判定
            // =========================
            if (data.error === 'KYC_REQUIRED') {
                router.push('/auth/kyc');
                return;
            }

            // =========================
            // 投稿制限
            // =========================
            if (data.error === 'FUTURE_POST_LIMIT') {
                setError({
                    type: 'limit',
                    message:
                        '投稿は1アカウント3件までです。\n' +
                        '新たに投稿する場合は既存投稿を削除して、投稿しなおしてください。',
                });
                setIsSubmitting(false);
                return;
            }

            // =========================
            // その他エラー
            // =========================
            if (!res.ok) {
                throw new Error(data.error || '投稿に失敗しました');
            }

            router.push('/auth/dashboard');
        } catch (e: any) {
            setError({
                type: 'normal',
                message: e.message || '投稿に失敗しました',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">新規投稿</h1>

            {/* エラー表示 */}
            {error && (
                <div className="mb-4 p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 whitespace-pre-line">
                    <p className="font-semibold mb-1">
                        {error.type === 'limit'
                            ? '投稿制限に達しています'
                            : 'エラー'}
                    </p>
                    <p className="text-sm">{error.message}</p>

                    {error.type === 'limit' && (
                        <button
                            onClick={() => router.push('/auth/posts/list')}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded"
                        >
                            投稿一覧へ移動する
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">日付</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full border rounded p-2 ${
                            isImmediate
                                ? 'bg-gray-100 cursor-not-allowed'
                                : ''
                        }`}
                        readOnly={isImmediate}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">
                        メッセージ
                    </label>
                    <p className="text-sm text-gray-500 mb-1">
                        検索機能があるため、場所・人数・自分たちの年齢を書くとリクエストが届きやすくなります
                    </p>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={exampleMessage}
                        maxLength={255}
                        rows={4}
                        className="w-full border rounded p-2 resize-none"
                        required
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isImmediate}
                        onChange={() => setIsImmediate(!isImmediate)}
                        id="immediate"
                    />
                    <label htmlFor="immediate" className="font-medium">
                        今すぐ飲みたい
                    </label>
                </div>

                <div>
                    <label className="block mb-1 font-medium">
                        画像（最大2枚）
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                        添付ファイルは基本的に正方形で表示されます
                    </p>

                    <label className="block w-full bg-gray-200 text-gray-700 py-3 text-center rounded-lg cursor-pointer hover:bg-gray-300 transition">
                        画像を選択
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={images.length >= 2}
                        />
                    </label>

                    {images.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative w-24 h-24 flex-shrink-0"
                                >
                                    <img
                                        src={URL.createObjectURL(img)}
                                        alt={`preview-${idx}`}
                                        className="w-full h-full object-cover rounded"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        onClick={() =>
                                            setImages(
                                                images.filter(
                                                    (_, i) => i !== idx
                                                )
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white font-semibold py-3 rounded-xl shadow-md transition
                        ${
                            isSubmitting
                                ? 'bg-green-300 cursor-not-allowed opacity-50'
                                : 'bg-green-500 hover:bg-green-600'
                        }
                    `}
                >
                    {isSubmitting ? '送信中...' : '投稿する'}
                </button>
            </form>
        </main>
    );
}