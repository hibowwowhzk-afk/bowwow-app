
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    XMarkIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

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
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isCheckingKyc, setIsCheckingKyc] = React.useState(false);

    const normalized = message.trim();

    // モーダルを開く前に本人確認をチェック
    const handleOpen = async () => {
        if (isCheckingKyc) return;

        setIsCheckingKyc(true);
        setError(null);

        try {
            const res = await fetch("/api/kyc/userVerification");

            if (!res.ok) {
                throw new Error("本人確認情報を取得できませんでした");
            }

            const data = await res.json();

            if (!data.verified) {
                router.push("/kyc");
                return;
            }

            setOpen(true);
        } catch (err) {
            console.error(err);
            setError("本人確認情報を確認できませんでした。時間をおいて再度お試しください。");
        } finally {
            setIsCheckingKyc(false);
        }
    };

    // モーダルを閉じる
    const handleClose = () => {
        if (isSubmitting) return;

        setOpen(false);
        setError(null);
    };

    // リクエスト送信
    const handleSend = async () => {
        if (isSubmitting) return;

        setError(null);

        if (!normalized) {
            setError("メッセージを入力してください");
            return;
        }

        if (normalized.length > 200) {
            setError("メッセージは200文字以内で入力してください");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch("/api/requests/insertRequest", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to_user_id: toUserId,
                    post_id: postId,
                    message: normalized,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setOpen(false);
                setMessage("");
                setError(null);

                alert("リクエストを送信しました！");
                window.location.reload();
                return;
            }

            switch (data.error) {
                case "ALREADY_REQUESTED":
                    setError("すでにリクエスト済みです");
                    break;

                case "MESSAGE_TOO_LONG":
                    setError("メッセージは200文字以内で入力してください");
                    break;

                case "MISSING_REQUIRED_FIELDS":
                    setError("入力内容に不備があります");
                    break;

                case "USER_NOT_FOUND":
                    setError("ユーザーが見つかりません");
                    break;

                default:
                    setError("送信に失敗しました。時間をおいて再度お試しください");
                    break;
            }
        } catch (err) {
            console.error(err);
            setError("通信エラーが発生しました。再度お試しください");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* リクエストボタン */}
            <Button
                onClick={handleOpen}
                className="w-full py-4 text-base font-bold"
                disabled={isCheckingKyc}
            >
                {isCheckingKyc ? "確認中..." : "リクエストする"}
            </Button>

            {/* モーダル */}
            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            handleClose();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="request-modal-title"
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2
                                        id="request-modal-title"
                                        className="font-bold text-slate-900"
                                    >
                                        リクエストを送る
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        相手に一言メッセージを送りましょう
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                aria-label="閉じる"
                                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* 入力エリア */}
                        <div className="p-5">
                            <label
                                htmlFor="request-message"
                                className="mb-2 block text-sm font-semibold text-slate-800"
                            >
                                一言メッセージ
                                <span className="ml-1 text-red-500">*</span>
                            </label>

                            <textarea
                                id="request-message"
                                className={`w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
                                    error
                                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                }`}
                                rows={5}
                                maxLength={200}
                                placeholder="例：23歳、24歳です！博多付近ならすぐ行けます！"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    if (error) setError(null);
                                }}
                                disabled={isSubmitting}
                            />

                            <div className="mt-2 flex items-center justify-between">
                                <p className="text-xs text-slate-400">
                                    相手に伝えたいことを入力してください
                                </p>

                                <span
                                    className={`text-xs tabular-nums ${
                                        message.length >= 180
                                            ? "font-semibold text-orange-500"
                                            : "text-slate-400"
                                    }`}
                                >
                                    {message.length}/200
                                </span>
                            </div>

                            {/* エラー表示 */}
                            {error && (
                                <div
                                    role="alert"
                                    className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2"
                                >
                                    <p className="text-sm text-red-600">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* ボタン */}
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={isSubmitting}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-100"
                                >
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                    {isSubmitting ? "送信中..." : "送信する"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};