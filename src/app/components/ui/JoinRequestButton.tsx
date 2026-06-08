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
    const [error, setError] = React.useState<string | null>(null);

    const handleOpen = async () => {
        try {
            const res = await fetch("/api/kyc/userVerification");
            const data = await res.json();

            if (!data.verified) {
                router.push("/kyc");
                return;
            }

            setOpen(true);
        } catch (err) {
            console.error(err);
            router.push("/kyc");
        }
    };

    const handleSend = async () => {
        setError(null);

        // =========================
        // フロントバリデーション
        // =========================
        const normalized = message?.trim();

        if (!normalized) {
            setError("メッセージを入力してください");
            return;
        }

        if (normalized.length > 200) {
            setError("メッセージは200文字以内で入力してください");
            return;
        }

        const res = await fetch("/api/requests/insertRequest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to_user_id: toUserId,
                post_id: postId,
                message: normalized,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            alert("リクエストを送信しました！");
            setOpen(false);
            setMessage("");
            setError(null);
            return;
        }

        // =========================
        // サーバーエラー完全対応
        // =========================
        switch (data.error) {
            case "ALREADY_REQUESTED":
                setError("すでにリクエスト済みです");
                return;

            case "MESSAGE_TOO_LONG":
                setError("メッセージは200文字以内です");
                return;

            case "MISSING_REQUIRED_FIELDS":
                setError("入力内容に不備があります");
                return;

            case "USER_NOT_FOUND":
                setError("ユーザーが見つかりません");
                return;

            default:
                setError("送信に失敗しました");
                return;
        }
    };

    return (
        <>
            <Button onClick={handleOpen} className="w-full py-4 text-lg">
                リクエスト
            </Button>

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

                        {/* エラー表示（UI崩さない） */}
                        {error && (
                            <p className="text-red-500 text-sm mt-2">
                                {error}
                            </p>
                        )}

                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setOpen(false);
                                    setError(null);
                                }}
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