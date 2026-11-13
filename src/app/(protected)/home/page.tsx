
'use client';

import { useRouter } from "next/navigation";
import SummaryCard from "@/app/components/ui/SummaryCard";

export default function HomePage() {
    const router = useRouter();

    const handleCreatePost = async () => {
        try {
            const res = await fetch("/api/kyc/userVerification");
            const data = await res.json();

            if (!data.verified) {
                router.push("/kyc");
                return;
            }

            router.push("/posts/create");
        } catch (err) {
            console.error(err);
            router.push("/kyc");
        }
    };

    return (
        <main className="pb-20 pt-6 px-6 max-w-md mx-auto text-gray-900 bg-white min-h-screen">

            <h1 className="text-2xl font-bold mb-4 text-gray-900">
                ホーム
            </h1>

            {/* サマリー */}
            <SummaryCard />

            {/* メインアクション */}
            <section className="space-y-4 mb-8">

                <button
                    onClick={handleCreatePost}
                    className="block w-full bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    投稿する
                </button>

                <a
                    href="/dashboard"
                    className="block w-full bg-red-500 hover:bg-red-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    今すぐ飲みたい
                </a>

                <a
                    href="/search"
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    条件から探す
                </a>

            </section>

            {/* 各種リスト */}
            <section className="grid grid-cols-1 gap-3">

                <a
                    href="/posts/list"
                    className="flex justify-between items-center bg-white text-gray-900 hover:bg-gray-50 border rounded-lg p-4 shadow-sm"
                >
                    <span className="text-gray-900">
                        投稿リスト
                    </span>
                    <span className="text-gray-400">›</span>
                </a>

                <a
                    href="/requests"
                    className="flex justify-between items-center bg-white text-gray-900 hover:bg-gray-50 border rounded-lg p-4 shadow-sm"
                >
                    <span className="text-gray-900">
                        リクエストリスト
                    </span>
                    <span className="text-gray-400">›</span>
                </a>

                <a
                    href="/matchings"
                    className="flex justify-between items-center bg-white text-gray-900 hover:bg-gray-50 border rounded-lg p-4 shadow-sm"
                >
                    <span className="text-gray-900">
                        マッチングリスト
                    </span>
                    <span className="text-gray-400">›</span>
                </a>

                <a
                    href="/matchings/history"
                    className="flex justify-between items-center bg-white text-gray-900 hover:bg-gray-50 border rounded-lg p-4 shadow-sm"
                >
                    <div>
                        <div className="text-gray-900">
                            マッチング履歴
                        </div>
                        <div className="text-xs text-orange-500">
                            開催後の結果を回答
                        </div>
                    </div>

                    <span className="text-gray-400">›</span>
                </a>

            </section>

        </main>
    );
}
