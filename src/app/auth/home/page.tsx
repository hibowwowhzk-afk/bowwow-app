'use client';

import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();

    const handleCreatePost = async () => {
        try {
            // ユーザーの本人確認状態を取得
            const res = await fetch("/api/kyc/userVerification");
            const data = await res.json();

            // 未確認ならKYCへ
            if (!data.verified) {
                router.push("/auth/kyc");
                return;
            }

            // 確認済みなら投稿画面へ
            router.push("/auth/posts/create");

        } catch (err) {
            console.error(err);
            // エラー時も安全側に倒す
            router.push("/auth/kyc");
        }
    };

    return (
        <main className="pb-20 pt-6 px-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">ホーム</h1>

            <section className="space-y-4 mb-8">
                <button
                    onClick={handleCreatePost}
                    className="block w-full bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    投稿する
                </button>

                <a
                    href="/auth/dashboard"
                    className="block w-full bg-red-500 hover:bg-red-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    今すぐ飲みたい
                </a>

                <a
                    href="/auth/search"
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-4 rounded-xl text-center shadow-md transition"
                >
                    条件から探す
                </a>
            </section>

            <section className="grid grid-cols-1 gap-3">
                <a href="/auth/requests" className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4">
                    <span>リクエストリスト</span>
                    <span className="text-gray-500">›</span>
                </a>

                <a href="/auth/matchings" className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4">
                    <span>マッチリスト</span>
                    <span className="text-gray-500">›</span>
                </a>

                <a href="/auth/posts/list" className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 rounded-lg p-4">
                    <span>ポストリスト</span>
                    <span className="text-gray-500">›</span>
                </a>
            </section>
        </main>
    );
}