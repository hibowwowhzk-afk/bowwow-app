// src/app/components/JoinRequestButton.tsx
"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/RequestButton";

type Props = {
    toUserId: number;
    postId: number;
};

export const JoinRequestButton: React.FC<Props> = ({ toUserId, postId }) => {
    const [open, setOpen] = React.useState(false);
    const [message, setMessage] = React.useState("");

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
        <Button onClick={() => setOpen(true)}>リクエスト</Button>

        {/* モーダル */}
        {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold mb-4">一言メッセージ</h2>
                <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                maxLength={200}
                placeholder="例: 23歳,24歳です。博多付近すぐ行けます!!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                />

                <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                    キャンセル
                </Button>
                <Button onClick={handleSend}>送信</Button>
                </div>
            </div>
            </div>
        )}
        </>
    );
};