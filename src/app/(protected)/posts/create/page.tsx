'use client';

import {
    useState,
    ChangeEvent,
    FormEvent,
    useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

type FieldErrors = {
    message?: string;
    date?: string;
    common?: string;
} | null;

type ApiResponse = {
    code?: string;
    message?: string;
};

export default function CreatePostPage() {
    const router = useRouter();

    const [date, setDate] = useState('');
    const [message, setMessage] = useState('');
    const [isImmediate, setIsImmediate] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [errors, setErrors] = useState<FieldErrors>(null);
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

    const handleImageChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files).slice(0, 2));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors(null);

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();

            formData.append('date', date);
            formData.append('message', message);
            formData.append(
                'isImmediate',
                isImmediate ? '1' : '0'
            );

            images.forEach((img) =>
                formData.append('images', img)
            );

            const res = await fetch('/api/posts/create', {
                method: 'POST',
                body: formData,
            });

            const data: ApiResponse = await res.json();

            // =========================
            // KYC
            // =========================
            if (data.code === 'KYC_REQUIRED') {
                router.push('/kyc');
                return;
            }

            // =========================
            // Validation Errors
            // =========================
            if (!res.ok) {
                switch (data.code) {
                    case 'MESSAGE_REQUIRED':
                    case 'MESSAGE_TOO_LONG':
                        setErrors({
                            message: data.message,
                        });
                        break;

                    case 'DATE_REQUIRED':
                    case 'PAST_DATE_NOT_ALLOWED':
                        setErrors({
                            date: data.message,
                        });
                        break;

                    case 'IMAGE_LIMIT_EXCEEDED':
                    case 'IMAGE_TOO_LARGE':
                    case 'INVALID_IMAGE_TYPE':
                        setErrors({
                            common: data.message,
                        });
                        break;

                    case 'FUTURE_POST_LIMIT':
                    case 'ALREADY_POSTED_TODAY':
                        setErrors({
                            common: data.message,
                        });
                        break;

                    default:
                        setErrors({
                            common:
                                data.message ||
                                'エラーが発生しました',
                        });
                }

                setIsSubmitting(false);
                return;
            }

            router.push('/dashboard');
        } catch (e: any) {
            setErrors({
                common:
                    e.message ||
                    '通信エラーが発生しました',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">
                新規投稿
            </h1>

            {/* Error */}
            {errors && (
                <div className="mb-4 p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 whitespace-pre-line">
                    {errors.date && (
                        <p className="text-sm mb-1">
                            ・{errors.date}
                        </p>
                    )}

                    {errors.message && (
                        <p className="text-sm mb-1">
                            ・{errors.message}
                        </p>
                    )}

                    {errors.common && (
                        <p className="font-semibold text-sm">
                            {errors.common}
                        </p>
                    )}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >
                {/* Date */}
                <div>
                    <label className="block mb-1 font-medium">
                        日付
                    </label>

                    <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                            setDate(e.target.value)
                        }
                        className={`w-full border rounded p-2 ${
                            isImmediate
                                ? 'bg-gray-100 cursor-not-allowed'
                                : ''
                        }`}
                        readOnly={isImmediate}
                    />
                </div>

                {/* Message */}
                <div>
                    <label className="block mb-1 font-medium">
                        メッセージ
                    </label>

                    <p className="text-sm text-gray-500 mb-1">
                        検索機能があるため、場所・人数・自分たちの年齢を書くとリクエストが届きやすくなります
                    </p>

                    <textarea
                        value={message}
                        onChange={(e) =>
                            setMessage(e.target.value)
                        }
                        placeholder={exampleMessage}
                        maxLength={255}
                        rows={4}
                        className="w-full border rounded p-2 resize-none"
                        required
                    />
                </div>

                {/* Immediate */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isImmediate}
                        onChange={() =>
                            setIsImmediate(!isImmediate)
                        }
                        id="immediate"
                    />

                    <label
                        htmlFor="immediate"
                        className="font-medium"
                    >
                        今すぐ飲みたい
                    </label>
                </div>

                {/* Images */}
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
                                        src={URL.createObjectURL(
                                            img
                                        )}
                                        alt={`preview-${idx}`}
                                        className="w-full h-full object-cover rounded"
                                    />

                                    <button
                                        type="button"
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        onClick={() =>
                                            setImages(
                                                images.filter(
                                                    (_, i) =>
                                                        i !== idx
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

                {/* Submit */}
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
                    {isSubmitting
                        ? '送信中...'
                        : '投稿する'}
                </button>
            </form>
        </main>
    );
}   