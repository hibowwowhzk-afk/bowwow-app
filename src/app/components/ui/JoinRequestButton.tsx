// src/app/components/JoinRequestButton.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/app/components/ui/RequestButton";

type Props = {
    toUserId: number;
    postId: number;
};

export const JoinRequestButton: React.FC<Props> = ({
    toUserId,
    postId,
}) => {
    const router = useRouter();

    const [open, setOpen] = React.useState(false);
    const [message, setMessage] = React.useState("");

    // モーダル開く前にKYCチェック
    const handleOpen = async () => {
        try {
            const res = await fetch("/api/kyc/userVerification");

            const data = await res.json();

            // 未確認ならKYCへ
            if (!data.verified) {
                router.push("/auth/kyc");
                return;
            }

            // 確認済みならモーダル開く
            setOpen(true);

        } catch (err) {
            console.error(err);

            // エラー時も安全側
            router.push("/auth/kyc");
        }
    };

    const handleSend = async () => {
        const res = await fetch("/api/requests/insertRequest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to_user_id: toUserId,
                post_id: postId,
                message: message || "よろしくお願いします！",
            }),
        });

        if (res.ok) {
            alert("リクエストを送信しました！");
            setOpen(false);
            setMessage("");
        } else {
            alert("送信に失敗しました");
        }
    };

    return (
        <>
            {/* リクエストボタン */}
            <Button
                onClick={handleOpen}
                className="w-full py-4 text-lg"
            >
                リクエスト
            </Button>

            {/* モーダル */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            一言メッセージ
                        </h2>

                        <textarea
                            className="w-full border p-2 text-sm"
                            rows={4}
                            maxLength={200}
                            placeholder="例: 23歳,24歳です。博多付近すぐ行けます!!"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setOpen(false)}
                                className="w-full sm:w-auto py-3 text-base"
                            >
                                キャンセル
                            </Button>

                            <Button
                                onClick={handleSend}
                                className="w-full sm:w-auto py-3 text-base"
                            >
                                送信
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};