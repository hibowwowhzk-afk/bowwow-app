"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ConversationModalFromRequest from "@/app/components/ui/ConversationModalFromRequest";
import ProfileModal from "@/app/components/ui/ProfileModal";

type Request = {
    request_id: number;
    request_message: string;
    request_created_at: string;
    user_display_name: string;
    user_profile_image: string | null;
    from_user_id: number;
    to_user_id: number;
    post_date: string;
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
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">
                    承認時の一言メッセージ
                </h3>

                <textarea
                    className="w-full p-2 border rounded resize-none mb-2"
                    rows={4}
                    maxLength={200}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                {error && (
                    <p className="text-red-500 text-sm mb-3">{error}</p>
                )}

                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                        onClick={onClose}
                    >
                        キャンセル
                    </button>

                    <button
                        className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                        onClick={handleSubmit}
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function RequestsPageClient() {
    const [requestsFromMe, setRequestsFromMe] = useState<Request[]>([]);
    const [requestsFromOthers, setRequestsFromOthers] = useState<Request[]>([]);
    const [actionStatuses, setActionStatuses] =
        useState<Record<number, ActionStatus>>({});

    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"fromMe" | "fromOthers">("fromOthers");

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [modalRequestId, setModalRequestId] = useState<number | null>(null);

    const [highlightIds, setHighlightIds] = useState<number[]>([]);
    const [openConversationId, setOpenConversationId] = useState<number | null>(null);
    const [openProfileId, setOpenProfileId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        setHighlightIds(
            searchParams.get("highlight")?.split(",").map(Number) || []
        );
    }, [searchParams]);

    useEffect(() => {
        async function fetchRequests() {
            try {
                const [resMe, resOthers] = await Promise.all([
                    fetch("/api/requests/getFromMe"),
                    fetch("/api/requests/getFromOthers"),
                ]);

                const [dataMe, dataOthers] = await Promise.all([
                    resMe.json(),
                    resOthers.json(),
                ]);

                if (resMe.ok) setRequestsFromMe(dataMe.requestList || []);
                if (resOthers.ok) setRequestsFromOthers(dataOthers.requestList || []);

                if (!resMe.ok || !resOthers.ok) {
                    throw new Error("リクエスト取得失敗");
                }
            } catch {
                setError("リクエスト情報の取得に失敗しました");
            }
        }

        fetchRequests();
    }, []);

    const currentList =
        tab === "fromMe" ? requestsFromMe : requestsFromOthers;

    const checkKyc = async (): Promise<boolean> => {
        try {
            const res = await fetch("/api/kyc/userVerification");
            const data = await res.json();

            if (!data.verified) {
                router.push("/kyc");
                return false;
            }

            return true;
        } catch (err) {
            router.push("/kyc");
            return false;
        }
    };

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

            // UI更新（最小）
            setRequestsFromMe((prev) =>
                prev.filter((r) => r.request_id !== requestId)
            );
        } catch (e) {
            alert((e as Error).message);
        }
    }

    async function openApproveModal(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setModalRequestId(requestId);
        setIsApproveModalOpen(true);
    }

    async function submitAction(message: string) {
        if (modalRequestId === null) return;

        setActionStatuses((prev) => ({
            ...prev,
            [modalRequestId]: "accepted",
        }));

        setIsApproveModalOpen(false);

        try {
            const res = await fetch(
                `/api/requests/${modalRequestId}/accepted`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ match_message: message }),
                }
            );

            if (!res.ok) throw new Error("承諾失敗");

        } catch (e) {
            alert((e as Error).message);

            setActionStatuses((prev) => ({
                ...prev,
                [modalRequestId]: null,
            }));
        }
    }

    async function rejectAction(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setActionStatuses((prev) => ({
            ...prev,
            [requestId]: "rejected",
        }));

        try {
            const res = await fetch(
                `/api/requests/${requestId}/rejected`,
                { method: "POST" }
            );

            if (!res.ok) throw new Error("拒否失敗");

        } catch (e) {
            alert((e as Error).message);

            setActionStatuses((prev) => ({
                ...prev,
                [requestId]: null,
            }));
        }
    }

    async function openConversationSafe(requestId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setOpenConversationId(requestId);
    }

    async function openProfileSafe(user: Request) {
        const ok = await checkKyc();
        if (!ok) return;

        const otherUserId =
            tab === "fromOthers"
                ? user.from_user_id
                : user.to_user_id;

        setOpenProfileId(otherUserId);
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">
                リクエストリスト
            </h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* タブ */}
            <div className="flex mb-4 border-b border-gray-300">
                <button
                    onClick={() => setTab("fromMe")}
                    className={`flex-1 py-2 text-center ${
                        tab === "fromMe"
                            ? "border-b-2 border-blue-600 font-bold"
                            : "text-gray-500"
                    }`}
                >
                    自分から
                </button>

                <button
                    onClick={() => setTab("fromOthers")}
                    className={`flex-1 py-2 text-center ${
                        tab === "fromOthers"
                            ? "border-b-2 border-blue-600 font-bold"
                            : "text-gray-500"
                    }`}
                >
                    相手から
                </button>
            </div>

            {/* リスト */}
            <ul className="space-y-4">
                {currentList.length === 0 ? (
                    <li className="text-gray-500">
                        リクエストはありません
                    </li>
                ) : (
                    currentList.map((user) => {
                        const isFromOthers = tab === "fromOthers";
                        const status = actionStatuses[user.request_id];

                        return (
                            <li
                                key={user.request_id}
                                className="flex flex-col p-4 border rounded-lg shadow-sm bg-white"
                            >
                            {/* 画像 */}
                            <div className="w-full aspect-square mb-4 overflow-hidden rounded-lg shadow">
                                {user.user_profile_image ? (
                                    <img
                                        src={user.user_profile_image}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold text-4xl">
                                        {user.user_display_name[0]}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-start mb-4 relative">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {user.user_display_name}
                                </h2>

                                {tab === "fromMe" && (
                                    <button
                                        onClick={() =>
                                            setOpenMenuId(
                                                openMenuId === user.request_id
                                                    ? null
                                                    : user.request_id
                                            )
                                        }
                                        className="text-2xl leading-none px-2 text-gray-500"
                                    >
                                        ⋮
                                    </button>
                                )}

                                {tab === "fromMe" && openMenuId === user.request_id && (
                                    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 min-w-[180px] overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setOpenMenuId(null);
                                                cancelRequest(user.request_id);
                                            }}
                                            className="block w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100"
                                        >
                                            キャンセル
                                        </button>
                                    </div>
                                )}
                            </div>

                                {/* ボタン */}
                                <div className="flex flex-col space-y-2 mb-4">
                                    <button
                                        className="w-full px-4 py-2 text-base bg-blue-500 text-white rounded"
                                        onClick={() =>
                                            openConversationSafe(user.request_id)
                                        }
                                    >
                                        やりとり
                                    </button>

                                    <button
                                        className="w-full px-4 py-2 text-base bg-gray-500 text-white rounded"
                                        onClick={() =>
                                            openProfileSafe(user)
                                        }
                                    >
                                        プロフィール
                                    </button>
                                </div>

                                {/* 日時 */}
                                <div className="text-sm text-gray-500 mb-2">
                                    {isFromOthers ? "受信日時" : "送信日時"}:{" "}
                                    {new Date(user.request_created_at).toLocaleString("ja-JP")}
                                </div>

                                {/* メッセージ */}
                                <div className="mb-3">
                                    <p className="text-sm text-blue-800 font-medium">
                                        リクエストメッセージ:
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {user.request_message}
                                    </p>
                                </div>

                                {/* 承認・拒否（そのまま） */}
                                {isFromOthers && (
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() =>
                                                openApproveModal(user.request_id)
                                            }
                                            disabled={!!status}
                                            className="w-full px-4 py-2 rounded bg-green-500 text-white"
                                        >
                                            承諾
                                        </button>

                                        <button
                                            onClick={() =>
                                                rejectAction(user.request_id)
                                            }
                                            disabled={!!status}
                                            className="w-full px-4 py-2 rounded bg-gray-600 text-white"
                                        >
                                            拒否
                                        </button>
                                    </div>
                                )}

                                {openConversationId === user.request_id && (
                                    <ConversationModalFromRequest
                                        requestId={user.request_id}
                                        onClose={() =>
                                            setOpenConversationId(null)
                                        }
                                    />
                                )}
                            </li>
                        );
                    })
                )}
            </ul>

            <ApproveModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onSubmit={submitAction}
            />

            <ProfileModal
                userId={openProfileId ?? 0}
                source="requests"
                isOpen={!!openProfileId}
                onClose={() => setOpenProfileId(null)}
            />
        </div>
    );
}