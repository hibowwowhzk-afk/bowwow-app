'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type PostImage = {
    image_url: string;
    order: number;
};

type Post = {
    id: number;
    message: string;
    date: string | null;
    status: 'active' | 'closed';
    created_at: string;
    is_immediate: boolean;
    post_images: PostImage[];
};

export default function EditPostPage() {
    const router = useRouter();
    const params = useParams();
    const postId = params.id;

    const [date, setDate] = useState('');
    const [message, setMessage] = useState('');
    const [isImmediate, setIsImmediate] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [deletedImages, setDeletedImages] = useState<string[]>([]);
    const [imageChanged, setImageChanged] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/posts/${postId}/getPosts`);
                if (!res.ok) throw new Error('投稿の取得に失敗しました');
                const data: { post: Post } = await res.json();

                setMessage(data.post.message || '');
                setIsImmediate(data.post.is_immediate);
                let initialDate = '';
                if (data.post.is_immediate || !data.post.date) {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    initialDate = `${yyyy}-${mm}-${dd}`;
                } else {
                    const d = new Date(data.post.date);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    initialDate = `${yyyy}-${mm}-${dd}`;
                }
                setDate(initialDate);

                setExistingImages(data.post.post_images.map((img) => img.image_url));
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    useEffect(() => {
        if (isImmediate) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            setDate(`${yyyy}-${mm}-${dd}`);
        }
    }, [isImmediate]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).slice(0, 2);
            setImages(filesArray);
            setImageChanged(true);
        }
    };

    const handleDeleteExistingImage = (url: string) => {
        setExistingImages(existingImages.filter((img) => img !== url));
        setDeletedImages([...deletedImages, url]);
        setImageChanged(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (isSubmitting) return;
        setIsSubmitting(true);

        if (!message.trim()) {
            setError('メッセージは必須です');
            setIsSubmitting(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('date', date);
            formData.append('message', message);
            formData.append('isImmediate', isImmediate ? '1' : '0');
            formData.append('imageChanged', imageChanged ? '1' : '0');
            images.forEach((img) => formData.append('images', img));
            deletedImages.forEach((url) => formData.append('deletedImages[]', url));

            const res = await fetch(`/api/posts/${postId}/updatePost`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            // 成功アラート表示
            alert('投稿が更新されました！');

            // リストページへ遷移
            router.push('/auth/posts/list');
        } catch (e: any) {
            setError(e.message || '更新に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>読み込み中...</p>;

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">投稿編集</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">日付</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full border rounded p-2 ${isImmediate ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        readOnly={isImmediate}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">メッセージ</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
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
                    <label className="block mb-1 font-medium">画像（最大2枚）</label>

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

                    {existingImages.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                            {existingImages.map((url, idx) => (
                                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                                    <img src={url} alt={`existing-${idx}`} className="w-full h-full object-cover rounded" />
                                    <button
                                        type="button"
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        onClick={() => handleDeleteExistingImage(url)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {images.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                                    <img src={URL.createObjectURL(img)} alt={`preview-${idx}`} className="w-full h-full object-cover rounded" />
                                    <button
                                        type="button"
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
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
                        ${isSubmitting ? 'bg-green-300 cursor-not-allowed opacity-50' : 'bg-green-500 hover:bg-green-600'}
                    `}
                >
                    {isSubmitting ? '更新中...' : '更新する'}
                </button>
            </form>
        </main>
    );
}
