'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Request = {
    request_id: number;
    request_message: string;
    request_created_at: string;
    user_display_name: string;
    user_profile_image: string | null;
    from_user_id: number;
    to_user_id: number;
};

type ActionStatus = 'accepted' | 'rejected' | null;

type ApproveModalProps = {
    isOpen: boolean;
    initialMessage?: string;
    onClose: () => void;
    onSubmit: (message: string) => void;
};

const ApproveModal: React.FC<ApproveModalProps> = ({
    isOpen,
    initialMessage = '',
    onClose,
    onSubmit,
}) => {
    const [message, setMessage] = useState(initialMessage);

    useEffect(() => {
        if (isOpen) setMessage(initialMessage);
    }, [isOpen, initialMessage]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">承認時の一言メッセージ</h3>
                <textarea
                    className="w-full p-2 border rounded resize-none mb-4"
                    rows={4}
                    maxLength={255}
                    placeholder="一言メッセージを入力してください（任意）"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                        onClick={onClose}
                    >
                        キャンセル
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                        onClick={() => onSubmit(message)}
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function RequestsPage() {
    const [requestList, setRequestList] = useState<Request[]>([]);
    const [actionStatuses, setActionStatuses] = useState<Record<number, ActionStatus>>({});
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalRequestId, setModalRequestId] = useState<number | null>(null);
    const [tab, setTab] = useState<'fromMe' | 'fromOthers'>('fromOthers');
    const [highlightIds, setHighlightIds] = useState<number[]>([]);
    const searchParams = useSearchParams();

    // ログイン中の自分のID
    const selfUserId = 5;

    useEffect(() => {
        setHighlightIds(
            searchParams.get('highlight')?.split(',').map((id) => Number(id)) || []
        );
    }, [searchParams]);

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch('/api/requests/getRequests');
                const data = await res.json();
                if (res.ok) {
                    setRequestList(data.requestList || []);
                } else {
                    setError(data.error || 'データの取得に失敗しました');
                }
            } catch {
                setError('ネットワークエラーが発生しました');
            }
        }
        fetchRequests();
    }, []);

    // undefined安全にfilter
    const filteredList = (requestList ?? []).filter((r) =>
        tab === 'fromMe' ? r.from_user_id === selfUserId : r.to_user_id === selfUserId
    );

    function openModal(requestId: number) {
        setModalRequestId(requestId);
        setIsModalOpen(true);
    }

    async function submitAction(message: string) {
        if (modalRequestId === null) return;

        setActionStatuses((prev) => ({ ...prev, [modalRequestId]: 'accepted' }));
        setIsModalOpen(false);

        try {
            const res = await fetch(`/api/requests/${modalRequestId}/accepted`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ match_message: message || null }),
            });
            if (!res.ok) throw new Error('処理に失敗しました');
        } catch (e) {
            alert((e as Error).message);
            setActionStatuses((prev) => ({ ...prev, [modalRequestId]: null }));
        }
    }

    async function rejectAction(requestId: number) {
        setActionStatuses((prev) => ({ ...prev, [requestId]: 'rejected' }));

        try {
            const res = await fetch(`/api/requests/${requestId}/rejected`, { method: 'POST' });
            if (!res.ok) throw new Error('処理に失敗しました');
        } catch (e) {
            alert((e as Error).message);
            setActionStatuses((prev) => ({ ...prev, [requestId]: null }));
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">リクエスト一覧</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex mb-4 border-b border-gray-300">
                <button
                    onClick={() => setTab('fromMe')}
                    className={`flex-1 py-2 text-center ${
                        tab === 'fromMe' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'
                    }`}
                >
                    自分から
                </button>
                <button
                    onClick={() => setTab('fromOthers')}
                    className={`flex-1 py-2 text-center ${
                        tab === 'fromOthers' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'
                    }`}
                >
                    相手から
                </button>
            </div>

            <ul className="space-y-4">
                {filteredList.length === 0 ? (
                    <li className="text-gray-500">リクエストはありません</li>
                ) : (
                    filteredList.map((user) => {
                        const isHighlighted = highlightIds.includes(user.request_id);
                        const status = actionStatuses[user.request_id];
                        const isFromOthers = tab === 'fromOthers';

                        return (
                            <li
                                key={user.request_id}
                                className={`flex items-center p-4 border rounded-lg shadow-sm hover:bg-gray-50 ${
                                    isHighlighted ? 'border-blue-500 bg-blue-50' : 'bg-white'
                                }`}
                            >
                                <div className="w-24 h-24 rounded-full overflow-hidden mr-6 flex-shrink-0">
                                    {user.user_profile_image ? (
                                        <img
                                            src={user.user_profile_image}
                                            alt={user.user_display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold text-2xl">
                                            {user.user_display_name[0]}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-lg font-medium">{user.user_display_name}</h2>
                                        <span className="text-sm text-gray-500">
                                            {new Date(user.request_created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <p className="text-sm text-blue-800 font-medium">リクエストメッセージ:</p>
                                        <p className="text-sm text-gray-700">{user.request_message}</p>
                                    </div>

                                    {isFromOthers && (
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => openModal(user.request_id)}
                                                disabled={!!status}
                                                className={`px-4 py-2 rounded font-semibold text-white ${
                                                    status === 'accepted'
                                                        ? 'bg-green-600 cursor-default'
                                                        : 'bg-green-500 hover:bg-green-600'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {status === 'accepted' ? '承諾済み' : '承諾'}
                                            </button>
                                            <button
                                                onClick={() => rejectAction(user.request_id)}
                                                disabled={!!status}
                                                className={`px-4 py-2 rounded font-semibold text-white ${
                                                    status === 'rejected'
                                                        ? 'bg-gray-400 cursor-default'
                                                        : 'bg-gray-600 hover:bg-gray-700'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {status === 'rejected' ? '拒否済み' : '拒否'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            <ApproveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={submitAction}
            />
        </div>
    );
}