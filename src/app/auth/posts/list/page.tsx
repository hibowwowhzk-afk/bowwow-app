'use client';

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

type Post = {
    id: number
    message: string
    date: string | null
    status: "active" | "closed"
    created_at: string
    image_url?: string
}

export default function PostListPage() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/posts/list")
            const data = await res.json()
            setPosts(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    const handleDelete = async (id: number) => {
        const ok = confirm("この投稿を削除しますか？")
        if (!ok) return

        try {
            const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
            if (res.ok) {
                alert("削除しました。")
                fetchPosts()
            } else {
                alert("削除に失敗しました。")
            }
        } catch (e) {
            console.error(e)
            alert("エラーが発生しました。")
        }
    }

    return (
        <main className="pb-20 pt-6 px-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">ポストリスト</h1>

            {loading ? (
                <p>読み込み中...</p>
            ) : posts.length === 0 ? (
                <p>まだ投稿がありません。</p>
            ) : (
                <ul className="space-y-4">
                    {posts.map((post) => (
                        <li
                            key={post.id}
                            className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition"
                        >
                            <div className="flex gap-4">
                                {/* 画像部分 */}
                                {post.image_url ? (
                                    <Image
                                        src={post.image_url}
                                        alt="Post image"
                                        width={80}
                                        height={80}
                                        className="rounded-lg object-cover w-20 h-20"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                        No Image
                                    </div>
                                )}

                                {/* テキスト部分 */}
                                <div className="flex-1 flex flex-col justify-between">
                                    {/* 投稿日 */}
                                    <p className="text-sm text-gray-500">
                                        登録日: {new Date(post.created_at).toLocaleDateString()}
                                    </p>

                                    {/* 投稿メッセージ */}
                                    <Link href={`/auth/posts/${post.id}`}>
                                        <p className="text-gray-800 mt-1 font-medium line-clamp-2">
                                            {post.message}
                                        </p>
                                    </Link>

                                    {/* 開催日 */}
                                    {post.date && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            開催日: {new Date(post.date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ボタン部分（色だけ） */}
                            <div className="flex justify-end gap-3 mt-3">
                                <Link
                                    href={`/auth/posts/${post.id}/edit`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                >
                                    編集
                                </Link>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                >
                                    削除
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    )
}