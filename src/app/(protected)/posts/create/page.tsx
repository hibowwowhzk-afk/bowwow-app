
'use client';

import {
    useState,
    ChangeEvent,
    FormEvent,
    useEffect,
} from 'react';
import { useRouter } from 'next/navigation';

import {
    CalendarDaysIcon,
    BoltIcon,
    PhotoIcon,
    XMarkIcon,
    PlusCircleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

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
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [errors, setErrors] = useState<FieldErrors>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userAge = 20;
    const numPeople = 2;
    const locationExample = '博多駅周辺';

    const exampleMessage =
        `例: 場所: ${locationExample}、人数: ${numPeople}人、年齢: ${userAge}代前半`;

    // 今すぐ合流の場合は本日の日付を設定
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

    // 画像プレビュー生成と後片付け
    useEffect(() => {
        const urls = images.map((img) => URL.createObjectURL(img));

        setImagePreviews(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [images]);

    // 画像選択
    const handleImageChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files).slice(0, 2));
        }

        e.target.value = '';
    };

    // 画像削除
    const handleRemoveImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // 投稿処理
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

            // 本人確認
            if (data.code === 'KYC_REQUIRED') {
                router.push('/kyc');
                return;
            }

            // バリデーションエラー
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
                    case 'INVALID_IMAGE':
                    case 'EMPTY_IMAGE':
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

                return;
            }

            router.push('/dashboard');

        } catch (e: unknown) {
            setErrors({
                common:
                    e instanceof Error
                        ? e.message
                        : '通信エラーが発生しました',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 pt-6 pb-24 text-slate-900 sm:px-6">

            <div className="mx-auto max-w-md space-y-6">

                {/* ページタイトル */}
                <section>
                    <h1 className="text-2xl font-bold tracking-tight">
                        合コンを募集する
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        一緒に楽しめるグループを募集しましょう
                    </p>
                </section>

                {/* 入力フォーム */}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    {/* エラー表示 */}
                    {errors && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {errors.date && (
                                <p className="mb-1">
                                    ・{errors.date}
                                </p>
                            )}

                            {errors.message && (
                                <p className="mb-1">
                                    ・{errors.message}
                                </p>
                            )}

                            {errors.common && (
                                <p className="font-medium whitespace-pre-line">
                                    {errors.common}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 開催日 */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <CalendarDaysIcon className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold">
                                    開催日
                                </h2>
                                <p className="text-xs text-slate-500">
                                    合コンを開催する日を選択
                                </p>
                            </div>
                        </div>

                        <label
                            htmlFor="date"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            日付
                        </label>

                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            readOnly={isImmediate}
                            className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                                isImmediate
                                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
                                    : 'border-slate-300 bg-white'
                            }`}
                        />

                        {errors?.date && (
                            <p className="mt-2 text-sm text-red-600">
                                {errors.date}
                            </p>
                        )}

                        {/* 今すぐ合流 */}
                        <label
                            htmlFor="immediate"
                            className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                isImmediate
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <input
                                id="immediate"
                                type="checkbox"
                                checked={isImmediate}
                                onChange={() =>
                                    setIsImmediate(!isImmediate)
                                }
                                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />

                            <div className="flex flex-1 items-center gap-2">
                                <BoltIcon className="h-5 w-5 text-blue-600" />

                                <div>
                                    <p className="font-semibold text-slate-800">
                                        今すぐ合流
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        今日開催できる募集にする
                                    </p>
                                </div>
                            </div>
                        </label>

                        <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <p>
                                今すぐ合流を選ぶと、本日の日付が自動設定されます。
                            </p>
                        </div>

                    </section>

                    {/* メッセージ */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-4">
                            <h2 className="font-bold">
                                募集メッセージ
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                相手に伝えたい内容を入力してください
                            </p>
                        </div>

                        <label
                            htmlFor="message"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            メッセージ
                        </label>

                        <p className="mb-3 text-xs leading-relaxed text-slate-500">
                            場所・人数・年齢などを記載すると、条件に合うグループから見つけてもらいやすくなります。
                        </p>

                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={exampleMessage}
                            maxLength={255}
                            rows={5}
                            required
                            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-2 flex justify-between text-xs">
                            {errors?.message ? (
                                <p className="text-red-600">
                                    {errors.message}
                                </p>
                            ) : (
                                <p className="text-slate-400">
                                    最大255文字
                                </p>
                            )}

                            <p className="text-slate-400">
                                {message.length}/255
                            </p>
                        </div>

                    </section>

                    {/* 画像 */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <PhotoIcon className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="font-bold">
                                    募集画像
                                </h2>
                                <p className="text-xs text-slate-500">
                                    グループの雰囲気を伝えよう
                                </p>
                            </div>
                        </div>

                        <p className="mb-3 text-xs text-slate-500">
                            画像は最大2枚まで登録できます。
                        </p>

                        <label
                            htmlFor="images"
                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
                        >
                            <PlusCircleIcon className="mb-2 h-8 w-8 text-blue-600" />

                            <span className="text-sm font-semibold text-blue-600">
                                画像を選択する
                            </span>

                            <span className="mt-1 text-xs text-slate-400">
                                {images.length}/2 枚選択中
                            </span>

                            <input
                                id="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>

                        {/* プレビュー */}
                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                {images.map((img, idx) => (
                                    <div
                                        key={`${img.name}-${idx}`}
                                        className="relative aspect-square overflow-hidden rounded-xl border border-slate-200"
                                    >
                                        <img
                                            src={imagePreviews[idx]}
                                            alt={`募集画像 ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            aria-label={`画像${idx + 1}を削除`}
                                            onClick={() =>
                                                handleRemoveImage(idx)
                                            }
                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-red-600"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                    </section>

                    {/* 投稿ボタン */}
                    <div className="space-y-3 pt-2">

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-md transition active:scale-[0.98] ${
                                isSubmitting
                                    ? 'cursor-not-allowed bg-blue-300'
                                    : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? (
                                '送信中...'
                            ) : (
                                <>
                                    <PlusCircleIcon className="h-5 w-5" />
                                    募集を投稿する
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-400">
                            入力内容を確認してから投稿してください
                        </p>

                    </div>

                </form>

            </div>
        </main>
    );
}
