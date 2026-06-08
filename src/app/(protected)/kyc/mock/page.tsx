'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KycMockPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            // 擬似送信
            await fetch("/api/kyc/mock-submit", {
                method: "POST",
            });

            setTimeout(() => {
                alert("本人確認申請を受け付けました（審査中）");
                router.push("/dashboard");
            }, 1000);

        } catch (err) {
            console.error(err);
            alert("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="max-w-md mx-auto p-6">

            {/* ヘッダー */}
            <div className="mb-6">
                <h1 className="text-xl font-bold">本人確認</h1>
                <p className="text-sm text-gray-500">
                    安全なサービス提供のため本人確認を行います
                </p>
            </div>

            {/* ステップバー */}
            <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`flex-1 h-2 rounded-full ${
                            step >= s ? "bg-blue-600" : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>

            {/* STEP 1 */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="font-semibold">STEP 1: 注意事項</h2>

                    <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
                        <p>・運転免許証 / マイナンバーカードをご用意ください</p>
                        <p>・有効期限内のもののみ使用できます</p>
                        <p>・虚偽申請は禁止されています</p>
                        <p>・提出データは審査目的以外には使用されません</p>
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full bg-blue-600 text-white py-3 rounded"
                    >
                        同意して次へ
                    </button>
                </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="font-semibold">STEP 2: 身分証アップロード</h2>

                    {/* 撮影ガイド */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm space-y-2">
                        <p className="font-semibold text-blue-700">
                            撮影のポイント
                        </p>

                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>四隅がすべて写るように撮影してください</li>
                            <li>文字がはっきり読める明るさで撮影してください</li>
                            <li>影や反射が入らないようにしてください</li>
                            <li>机の上に置いて真上から撮ると綺麗に撮れます</li>
                        </ul>
                    </div>

                    {/* 参考 */}
                    <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
                        例：身分証は平らな場所に置いて撮影してください
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setFile(e.target.files[0]);
                            }
                        }}
                        className="w-full"
                    />

                    {file && (
                        <p className="text-sm text-green-600">
                            選択済み: {file.name}
                        </p>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={!file}
                        className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50"
                    >
                        次へ
                    </button>
                </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
                <div className="space-y-4">
                    <h2 className="font-semibold">STEP 3: 顔写真確認（擬似）</h2>

                    <div className="bg-gray-100 p-4 text-sm rounded space-y-2">
                        <p>カメラ認証の代わりにモック画面です</p>
                        <p className="text-gray-500">
                            ※本番では外部eKYCサービスに置き換わります
                        </p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded"
                    >
                        {loading ? "送信中..." : "本人確認を提出"}
                    </button>
                </div>
            )}
        </main>
    );
}