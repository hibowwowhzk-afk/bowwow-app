'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ConversationModalFromRequest from '@/app/components/ui/ConversationModalFromRequest';
import ProfileModal from '@/app/components/ui/ProfileModal';

type Request = {
    request_id: number;
    request_message: string;
    request_created_at: string;
    user_display_name: string;
    user_profile_image: string | null;
    from_user_id: number;
    to_user_id: number;
    post_date: string; // 合流希望日
};

type MessageType = {
    id: number;
    content: string;
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
    const [requestsFromMe, setRequestsFromMe] = useState<Request[]>([]);
    const [requestsFromOthers, setRequestsFromOthers] = useState<Request[]>([]);
    const [actionStatuses, setActionStatuses] = useState<Record<number, ActionStatus>>({});
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'fromMe' | 'fromOthers'>('fromOthers');
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [modalRequestId, setModalRequestId] = useState<number | null>(null);
    const [highlightIds, setHighlightIds] = useState<number[]>([]);
    const [openConversationId, setOpenConversationId] = useState<number | null>(null);
    const [openProfileId, setOpenProfileId] = useState<number | null>(null);

    const searchParams = useSearchParams();

    useEffect(() => {
        setHighlightIds(
            searchParams.get('highlight')?.split(',').map((id) => Number(id)) || []
        );
    }, [searchParams]);

    useEffect(() => {
        async function fetchRequestsFromMe() {
            try {
                const res = await fetch('/api/requests/getFromMe');
                const data = await res.json();
                if (res.ok) setRequestsFromMe(data.requestList || []);
                else throw new Error('自分からのリクエスト取得に失敗しました');
            } catch {
                setError('自分からのリクエストの取得に失敗しました');
            }
        }

        async function fetchRequestsFromOthers() {
            try {
                const res = await fetch('/api/requests/getFromOthers');
                const data = await res.json();
                if (res.ok) setRequestsFromOthers(data.requestList || []);
                else throw new Error('相手からのリクエスト取得に失敗しました');
            } catch {
                setError('相手からのリクエストの取得に失敗しました');
            }
        }

        fetchRequestsFromMe();
        fetchRequestsFromOthers();
    }, []);

    const currentList = tab === 'fromMe' ? requestsFromMe : requestsFromOthers;

    function openApproveModal(requestId: number) {
        setModalRequestId(requestId);
        setIsApproveModalOpen(true);
    }

    async function submitAction(message: string) {
        if (modalRequestId === null) return;

        setActionStatuses((prev) => ({ ...prev, [modalRequestId]: 'accepted' }));
        setIsApproveModalOpen(false);

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

    function openProfile(user: Request) {
        const otherUserId = tab === 'fromOthers' ? user.from_user_id : user.to_user_id;
        setOpenProfileId(otherUserId);
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-6">リクエストリスト</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* タブ切り替え */}
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

            {/* リクエストリスト */}
            <ul className="space-y-4">
                {currentList.length === 0 ? (
                    <li className="text-gray-500">リクエストはありません</li>
                ) : (
                    currentList.map((user) => {
                        const isHighlighted = highlightIds.includes(user.request_id);
                        const status = actionStatuses[user.request_id];
                        const isFromOthers = tab === 'fromOthers';

                        return (
                            <li
                                key={user.request_id}
                                className={`flex flex-col items-start p-4 border rounded-lg shadow-sm hover:bg-gray-50 ${
                                    isHighlighted ? 'border-blue-500 bg-blue-50' : 'bg-white'
                                }`}
                            >
                                {/* アイコンとボタン */}
                                <div className="flex items-start mb-3">
                                    <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0">
                                        {user.user_profile_image ? (
                                            <img
                                                src={user.user_profile_image}
                                                alt={user.user_display_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold text-3xl">
                                                {user.user_display_name[0]}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between ml-4">
                                        <div>
                                            <h2 className="text-lg font-medium">{user.user_display_name}</h2>
                                            <span className="text-sm text-gray-500 mt-1 block">
                                                合流希望日: {new Date(user.post_date).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>

                                        <div className="flex flex-col space-y-2 mt-3">
                                            <button
                                                className="w-full px-4 py-2 text-base bg-blue-500 text-white rounded hover:bg-blue-600"
                                                onClick={() => setOpenConversationId(user.request_id)}
                                            >
                                                やりとり
                                            </button>
                                            <button
                                                className="w-full px-4 py-2 text-base bg-gray-500 text-white rounded hover:bg-gray-600"
                                                onClick={() => openProfile(user)}
                                            >
                                                プロフィール
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 送信日時 */}
                                <div className="text-sm text-gray-500 mb-2">
                                    {tab === 'fromOthers' ? '受信日時' : '送信日時'}:{' '}
                                    {new Date(user.request_created_at).toLocaleString('ja-JP')}
                                </div>

                                {/* メッセージ */}
                                <div className="mb-3">
                                    <p className="text-sm text-blue-800 font-medium">リクエストメッセージ:</p>
                                    <p className="text-sm text-gray-700">{user.request_message}</p>
                                </div>

                                {/* 承諾・拒否ボタン */}
                                {isFromOthers && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => openApproveModal(user.request_id)}
                                            disabled={!!status}
                                            className={`w-full px-4 py-2 rounded font-semibold text-white ${
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
                                            className={`w-full px-4 py-2 rounded font-semibold text-white ${
                                                status === 'rejected'
                                                    ? 'bg-gray-400 cursor-default'
                                                    : 'bg-gray-600 hover:bg-gray-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {status === 'rejected' ? '拒否済み' : '拒否'}
                                        </button>
                                    </div>
                                )}

                                {openConversationId === user.request_id && (
                                    <ConversationModalFromRequest
                                        requestId={user.request_id}
                                        onClose={() => setOpenConversationId(null)}
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
                isOpen={!!openProfileId}
                onClose={() => setOpenProfileId(null)}
            />
        </div>
    );
}
