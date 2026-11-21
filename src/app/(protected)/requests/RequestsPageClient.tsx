
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import {
    UserCircleIcon,
    EllipsisVerticalIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    CheckIcon,
    XCircleIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

import ProfileModal from "@/app/components/ui/ProfileModal";

type Request = {
    request_id: number;
    post_id: number;
    request_message: string;
    request_created_at: string;
    user_display_name: string;
    user_profile_image: string | null;
    from_user_id: number;
    to_user_id: number;
    post_date: string;
    post_images?: string[];
    post_message?: string | null;
    post_created_at?: string | null;
};

type ActionStatus = "accepted" | "rejected" | null;

type ApproveModalProps = {
    isOpen: boolean;
    initialMessage?: string;
    onClose: () => void;
    onSubmit: (message: string) => void;
};

const ApproveModal: React.FC<ApproveModalProps> = ({
    isOpen,
    initialMessage = "",
    onClose,
    onSubmit,
}) => {
    const [message, setMessage] = useState(initialMessage);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setMessage(initialMessage);
            setError("");
        }
    }, [isOpen, initialMessage]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const normalized = message.trim();

        if (!normalized) {
            setError("メッセージを入力してください");
            return;
        }

        if (normalized.length > 200) {
            setError("メッセージは200文字以内で入力してください");
            return;
        }

        setError("");
        onSubmit(normalized);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="approve-modal-title"
                className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <CheckIcon className="h-5 w-5" />
                        </div>

                        <div>
                            <h2
                                id="approve-modal-title"
                                className="font-bold text-slate-900"
                            >
                                リクエストを承諾
                            </h2>
                            <p className="text-xs text-slate-500">
                                相手にメッセージを送りましょう
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-5">
                    <label
                        htmlFor="approve-message"
                        className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                        承認時の一言メッセージ
                        <span className="ml-1 text-red-500">*</span>
                    </label>

                    <textarea
                        id="approve-message"
                        className={`w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 ${
                            error
                                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                        rows={5}
                        maxLength={200}
                        placeholder="例：ありがとうございます！当日よろしくお願いします！"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (error) setError("");
                        }}
                    />

                    <div className="mt-2 flex justify-end">
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

                    {error && (
                        <p
                            role="alert"
                            className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                        >
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                        >
                            キャンセル
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
                        >
                            <PaperAirplaneIcon className="h-4 w-4" />
                            承諾して送信
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function RequestsPageClient() {
    const [requestsFromMe, setRequestsFromMe] = useState<Request[]>([]);
    const [requestsFromOthers, setRequestsFromOthers] = useState<Request[]>([]);

    const [actionStatuses, setActionStatuses] = useState<
        Record<number, ActionStatus>
    >({});

    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"fromMe" | "fromOthers">("fromOthers");

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [modalRequestId, setModalRequestId] = useState<number | null>(null);

    const [highlightIds, setHighlightIds] = useState<number[]>([]);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [openProfileId, setOpenProfileId] = useState<number | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        setHighlightIds(
            searchParams.get("highlight")?.split(",").map(Number) || []
        );
    }, [searchParams]);

    // リクエスト一覧取得
    useEffect(() => {
        async function fetchRequests() {
            try {
                setError(null);

                const [resMe, resOthers] = await Promise.all([
                    fetch("/api/requests/getFromMe"),
                    fetch("/api/requests/getFromOthers"),
                ]);

                const [dataMe, dataOthers] = await Promise.all([
                    resMe.json(),
                    resOthers.json(),
                ]);

                if (!resMe.ok || !resOthers.ok) {
                    throw new Error("リクエスト取得失敗");
                }
                setRequestsFromMe(dataMe.requestList || []);
                setRequestsFromOthers(dataOthers.requestList || []);
            } catch (err) {
                console.error(err);
                setError("リクエスト情報の取得に失敗しました");
            }
        }

        fetchRequests();
    }, []);

    const currentList =
        tab === "fromMe" ? requestsFromMe : requestsFromOthers;

    // 本人確認チェック
    const checkKyc = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/kyc/userVerification");

            if (!res.ok) {
                throw new Error("本人確認情報の取得に失敗しました");
            }

            const data = await res.json();

            if (!data.verified) {
                router.push("/kyc");
                return false;
            }

            return true;
        } catch (err) {
            console.error(err);
            setError("本人確認情報を確認できませんでした");
            return false;
        }
    };

    // プロフィール表示
    async function openProfileSafe(user: Request) {
        const otherUserId =
            tab === "fromOthers"
                ? user.from_user_id
                : user.to_user_id;

        if (!otherUserId) return;

        setOpenProfileId(otherUserId);
    }

    // リクエストキャンセル
    async function cancelRequest(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        try {
            const res = await fetch(`/api/requests/${requestId}/cancel`, {
                method: "POST",
            });

            if (!res.ok) {
                throw new Error("キャンセルに失敗しました");
            }

            setRequestsFromMe((prev) =>
                prev.filter((r) => r.request_id !== requestId)
            );
        } catch (err) {
            alert((err as Error).message);
        }
    }

    // 承認モーダル
    async function openApproveModal(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setModalRequestId(requestId);
        setIsApproveModalOpen(true);
    }

    // リクエスト承認
    async function submitAction(message: string) {
        if (modalRequestId === null) return;

        const requestId = modalRequestId;

        setActionStatuses((prev) => ({
            ...prev,
            [requestId]: "accepted",
        }));

        setIsApproveModalOpen(false);

        try {
            const res = await fetch(`/api/requests/${requestId}/accepted`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ match_message: message }),
            });

            if (!res.ok) {
                throw new Error("承諾に失敗しました");
            }

            setRequestsFromOthers((prev) =>
                prev.filter((r) => r.request_id !== requestId)
            );
        } catch (err) {
            alert((err as Error).message);

            setActionStatuses((prev) => ({
                ...prev,
                [requestId]: null,
            }));
        }
    }

    // リクエスト拒否
    async function rejectAction(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setActionStatuses((prev) => ({
            ...prev,
            [requestId]: "rejected",
        }));

        try {
            const res = await fetch(`/api/requests/${requestId}/rejected`, {
                method: "POST",
            });

            if (!res.ok) {
                throw new Error("拒否に失敗しました");
            }

            setRequestsFromOthers((prev) =>
                prev.filter((r) => r.request_id !== requestId)
            );
        } catch (err) {
            alert((err as Error).message);

            setActionStatuses((prev) => ({
                ...prev,
                [requestId]: null,
            }));
        }
    }

    // 開催日表示
    const formatEventDate = (date: string) => {
        if (!date) return "開催日未設定";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return date;

        return parsed.toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
        });
    };

    // 受信日時表示
const formatReceivedDate = (date: string | null | undefined): string => {
    if (!date) return '';

    const formattedDate = date.replace(' ', 'T');

    return new Date(formattedDate).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
            <div className="mx-auto max-w-md">

                {/* ページタイトル */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        リクエストリスト
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        合コンのリクエストを確認しましょう
                    </p>
                </div>

                {/* エラー表示 */}
                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                        {error}
                    </div>
                )}

                {/* タブ */}
                <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
                    <button
                        type="button"
                        onClick={() => setTab("fromOthers")}
                        className={`rounded-lg py-3 text-sm font-bold transition ${
                            tab === "fromOthers"
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        相手から
                        {requestsFromOthers.length > 0 && (
                            <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                    tab === "fromOthers"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-300 text-slate-600"
                                }`}
                            >
                                {requestsFromOthers.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("fromMe")}
                        className={`rounded-lg py-3 text-sm font-bold transition ${
                            tab === "fromMe"
                                ? "bg-white text-blue-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        自分から
                        {requestsFromMe.length > 0 && (
                            <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                                    tab === "fromMe"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-300 text-slate-600"
                                }`}
                            >
                                {requestsFromMe.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* リクエスト一覧 */}
                <ul className="space-y-4">
                    {currentList.length === 0 ? (
                        <li className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-400">
                                <UserCircleIcon className="h-7 w-7" />
                            </div>
                            <p className="font-semibold text-slate-700">
                                リクエストはありません
                            </p>
                        </li>
                    ) : (
                        currentList.map((user) => {
                            const isFromOthers = tab === "fromOthers";
                            const status = actionStatuses[user.request_id];
                            const isHighlighted = highlightIds.includes(
                                user.request_id
                            );

                            return (
                                <li
                                    key={user.request_id}
                                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                                        isHighlighted
                                            ? "border-blue-400 ring-2 ring-blue-100"
                                            : "border-slate-200"
                                    }`}
                                >
                                    <div className="p-4">

                                        {/* リクエストを送った人 */}
                                        <div className="mb-3 flex items-center gap-3">

                                            {/* プロフィール画像 */}
                                            <button
                                                type="button"
                                                onClick={() => openProfileSafe(user)}
                                                aria-label={`${user.user_display_name}のプロフィールを表示`}
                                                className="shrink-0 rounded-full transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                            >
                                                {user.user_profile_image ? (
                                                    <img
                                                        src={user.user_profile_image}
                                                        alt={`${user.user_display_name}のプロフィール画像`}
                                                        className="h-11 w-11 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                                        {user.user_display_name ? (
                                                            <span className="text-lg font-bold">
                                                                {user.user_display_name[0]}
                                                            </span>
                                                        ) : (
                                                            <UserCircleIcon className="h-8 w-8" />
                                                        )}
                                                    </div>
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {user.user_display_name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {isFromOthers
                                                        ? "あなたにリクエストしました"
                                                        : "あなたがリクエストしました"}
                                                </p>
                                            </div>

                                            {/* 自分から送ったリクエストのメニュー */}
                                            {tab === "fromMe" && (
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                openMenuId === user.request_id
                                                                    ? null
                                                                    : user.request_id
                                                            )
                                                        }
                                                        aria-label="メニュー"
                                                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100"
                                                    >
                                                        <EllipsisVerticalIcon className="h-6 w-6" />
                                                    </button>

                                                    {openMenuId === user.request_id && (
                                                        <div className="absolute right-0 top-10 z-20 min-w-[150px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setOpenMenuId(null);
                                                                    cancelRequest(user.request_id);
                                                                }}
                                                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                            >
                                                                <XCircleIcon className="h-5 w-5" />
                                                                キャンセル
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 募集投稿画像＋開催日 */}
                                        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                                            {user.post_images && user.post_images.length > 0 ? (
                                                <Swiper
                                                    modules={[Pagination]}
                                                    pagination={
                                                        user.post_images.length > 1
                                                            ? { clickable: true }
                                                            : false
                                                    }
                                                    className="h-full w-full"
                                                >
                                                    {user.post_images.slice(0, 2).map((image, index) => (
                                                        <SwiperSlide key={index}>
                                                            <img
                                                                src={image}
                                                                alt={`募集投稿の画像 ${index + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </SwiperSlide>
                                                    ))}
                                                </Swiper>
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 via-slate-100 to-blue-200">
                                                    <div className="text-center text-blue-400">
                                                        <UserCircleIcon className="mx-auto h-14 w-14" />
                                                        <p className="mt-1 text-xs font-medium">
                                                            画像はありません
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute left-3 top-3 z-10">
                                                <span className="inline-flex items-center rounded-lg bg-slate-900/75 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
                                                    {formatEventDate(user.post_date)} 開催
                                                </span>
                                            </div>
                                        </div>
                                        {/* 投稿日時 */}
                                        <div className="mb-4 flex items-center justify-end gap-1.5 text-xs text-slate-400">
                                            <ClockIcon className="h-4 w-4" />
                                            <span>
                                                投稿日時：
                                                {formatReceivedDate(user.post_created_at)}
                                            </span>
                                        </div>

                                        {/* 募集投稿メッセージ */}
                                        <div className="mb-4">
                                            <p className="mb-2 text-xs font-bold text-slate-500">
                                                募集投稿メッセージ
                                            </p>
                                            <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                                                {user.post_message || "投稿メッセージはありません"}
                                            </p>
                                        </div>

                                        {/* リクエストメッセージ */}
                                        <div>
                                            <p className="mb-2 text-xs font-bold text-blue-700">
                                                リクエストメッセージ
                                            </p>

                                            <p className="whitespace-pre-wrap break-words rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 text-sm leading-6 text-slate-700">
                                                {user.request_message}
                                            </p>

                                            {/* 受信日時 */}
                                            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-400">
                                                <ClockIcon className="h-4 w-4" />
                                                <span>
                                                    受信日時：
                                                    {formatReceivedDate(user.request_created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 承認・拒否 */}
                                        {isFromOthers && (
                                            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openApproveModal(user.request_id)
                                                    }
                                                    disabled={!!status}
                                                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <CheckIcon className="h-5 w-5" />
                                                    {status === "accepted"
                                                        ? "承諾済み"
                                                        : "承諾"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        rejectAction(user.request_id)
                                                    }
                                                    disabled={!!status}
                                                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                    {status === "rejected"
                                                        ? "拒否済み"
                                                        : "拒否"}
                                                </button>
                                            </div>
                                        )}

                                        {/* 状態表示 */}
                                        {status && (
                                            <p className="mt-3 text-center text-xs font-medium text-slate-500">
                                                {status === "accepted"
                                                    ? "このリクエストを承諾しました"
                                                    : "このリクエストを拒否しました"}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>

                {/* 承認モーダル */}
                <ApproveModal
                    isOpen={isApproveModalOpen}
                    onClose={() => setIsApproveModalOpen(false)}
                    onSubmit={submitAction}
                />

                {/* プロフィールモーダル */}
                <ProfileModal
                    userId={openProfileId ?? 0}
                    source="requests"
                    isOpen={!!openProfileId}
                    onClose={() => setOpenProfileId(null)}
                />
            </div>
        </main>
    );
}
