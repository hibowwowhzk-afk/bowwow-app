"use client"
import Link from "next/link"

export default function HomePage() {
    return (
        <main className="pb-20 pt-6 px-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">ホーム</h1>

            {/* メインアクション */}
            <section className="space-y-4 mb-8">
                <Link
                    href="/auth/dashboard"
                    className="block w-full bg-red-500 hover:bg-red-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    今すぐ飲みたい
                </Link>

                <Link
                    href="/auth/search"
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    条件から探す
                </Link>

                {/* 新規投稿ボタン */}
                <Link
                    href="/auth/posts/create"
                    className="block w-full bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    投稿する
                </Link>
            </section>

            {/* リスト系アクション */}
            <section className="grid grid-cols-1 gap-3">
                <Link
                    href="/auth/requests"
                    className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
                >
                    <span>リクエストリスト</span>
                    <span className="text-gray-500">›</span>
                </Link>

                <Link
                    href="/auth/matchings"
                    className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
                >
                    <span>マッチリスト</span>
                    <span className="text-gray-500">›</span>
                </Link>

                <Link
                    href="/auth/posts/list"
                    className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4"
                >
                    <span>ポストリスト</span>
                    <span className="text-gray-500">›</span>
                </Link>
            </section>
        </main>
    )
}
