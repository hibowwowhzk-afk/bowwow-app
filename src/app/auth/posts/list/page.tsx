'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Post = {
    id: number;
    message: string;
    date: string | null;
    status: "active" | "closed";
    created_at: string;
    image_url?: string | string[];
};

export default function PostListPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/posts/list");
            const data = await res.json();
            setPosts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id: number) => {
        const ok = confirm("この投稿を削除しますか？");
        if (!ok) return;

        try {
            const res = await fetch(`/api/posts/${id}/cancel`, { method: "DELETE" });
            if (res.ok) {
                alert("削除しました。");
                fetchPosts();
            } else {
                alert("削除に失敗しました。");
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました。");
        }
    };

    return (
        <main className="pb-20 pt-6 px-4 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">ポストリスト</h1>

            {loading ? (
                <p className="text-gray-500">読み込み中...</p>
            ) : posts.length === 0 ? (
                <p className="text-gray-500">まだ投稿がありません。</p>
            ) : (
                <ul className="space-y-6">
                    {posts.map((post) => {
                        const images = post.image_url
                            ? Array.isArray(post.image_url)
                                ? post.image_url.slice(0, 2)
                                : [post.image_url].slice(0, 2)
                            : [];

                        return (
                            <li
                                key={post.id}
                                className="bg-white rounded-xl shadow p-4 transition hover:shadow-md"
                            >
                                {/* 画像部分 */}
                                {images.length > 0 ? (
                                    <div className="flex gap-4 overflow-x-auto mb-4 justify-center">
                                        {images.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className="w-64 h-64 flex-shrink-0 relative rounded-xl overflow-hidden"
                                            >
                                                <Image
                                                    src={url}
                                                    alt={`Post image ${idx}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="w-64 h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm mx-auto mb-4">
                                        No Image
                                    </div>
                                )}

                                {/* 投稿テキスト部分（左寄せ） */}
                                <div>
                                    <p className="text-sm text-gray-500">
                                        登録日: {new Date(post.created_at).toLocaleDateString()}
                                    </p>

                                    <Link href={`/auth/posts/${post.id}/edit`}>
                                        <p className="text-gray-800 mt-2 font-medium line-clamp-2 cursor-pointer">
                                            {post.message}
                                        </p>
                                    </Link>

                                    {post.date && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            開催日: {new Date(post.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* ボタン部分（縦に並べる） */}
                                <div className="flex flex-col gap-2 mt-4">
                                    <Link
                                        href={`/auth/posts/${post.id}/edit`}
                                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-center"
                                    >
                                        編集
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-center"
                                    >
                                        削除
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
