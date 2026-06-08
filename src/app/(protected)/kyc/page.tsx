'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KycRedirectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleStartKyc = async () => {
        setLoading(true);

        try {
            // あなたのバックエンドから「eKYCセッションURL」を取得する想定
            const res = await fetch("/api/kyc/start", {
                method: "POST",
            });

            const data = await res.json();

            if (!data.url) {
                throw new Error("KYC URL取得失敗");
            }

            // 外部eKYCへリダイレクト
            window.location.href = data.url;

        } catch (err) {
            console.error(err);
            alert("本人確認を開始できませんでした");
            setLoading(false);
        }
    };

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">本人確認</h1>

            <p className="text-gray-600 text-sm mb-6">
                安全なサービス運営のため、外部サービスで本人確認を行います。
                数分で完了します。
            </p>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm">
                ・運転免許証 / マイナンバーカードが必要です<br />
                ・スマホで撮影して完了します<br />
                ・あなたの情報は外部認証機関で処理されます
            </div>

            <button
                onClick={handleStartKyc}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
            >
                {loading ? "準備中..." : "本人確認をはじめる"}
            </button>

            <button
                onClick={() => router.back()}
                className="w-full mt-3 text-gray-500 text-sm"
            >
                あとでやる
            </button>
        </main>
    );
}