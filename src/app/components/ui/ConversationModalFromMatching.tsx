'use client';

import React, { useEffect, useState } from 'react';

type ConversationModalProps = {
    matchId: number;
    onClose: () => void;
};

type PostInfo = {
    message: string;
    date: string;
    created_at: string;
    images: string[];
    fromUser: 'self' | 'other';
};

type MessageItem = {
    type: 'request' | 'match' | 'dm';
    message: string;
    fromUser: 'self' | 'other';
    created_at: string;
};

export default function ConversationModal({ matchId, onClose }: ConversationModalProps) {
    const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            try {
                const res = await fetch(
                    `/api/matchings/${matchId}/getConversationFromMatching`
                );

                const data = await res.json().catch(() => null);

                // =========================
                // 共通エラー処理（ここだけ）
                // =========================
                if (!res.ok) {
                    throw new Error(data?.error ?? 'データ取得に失敗しました');
                }

                const selfUserId = data.self_user_id;

                setPostInfo({
                    message: data.post_message,
                    date: data.post_date,
                    created_at: data.post_created_at,
                    images: data.post_images ?? [],
                    fromUser:
                        data.post_user_id === selfUserId ? 'self' : 'other',
                });

                const msgs: MessageItem[] = [];

                if (data.request_message) {
                    msgs.push({
                        type: 'request',
                        message: data.request_message,
                        fromUser:
                            data.request_from_user_id === selfUserId
                                ? 'self'
                                : 'other',
                        created_at: data.request_created_at,
                    });
                }

                if (data.match_message) {
                    msgs.push({
                        type: 'match',
                        message: data.match_message,
                        fromUser:
                            data.match_from_user_id === selfUserId
                                ? 'self'
                                : 'other',
                        created_at: data.matched_at,
                    });
                }

                if (data.dm_message) {
                    msgs.push({
                        type: 'dm',
                        message: data.dm_message,
                        fromUser:
                            data.dm_from_user_id === selfUserId
                                ? 'self'
                                : 'other',
                        created_at: data.dm_sent_at,
                    });
                }

                msgs.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                );

                setMessages(msgs);
            } catch (err) {
                console.error(err);
                setPostInfo(null);
                setMessages([]);
                alert((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [matchId]);

    const formatDateSafe = (dateStr: string) => {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
    };

    if (!postInfo) return null;

    const bubbleBg = (fromUser: 'self' | 'other') => fromUser === 'self' ? 'bg-blue-50' : 'bg-gray-100';

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">やりとり</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                </div>

                {loading ? (
                    <p className="text-gray-500">読み込み中...</p>
                ) : (
                    <div className="space-y-6">
                        {/* ポスト */}
                        <div className={`p-4 rounded-xl shadow ${bubbleBg(postInfo.fromUser)}`}>
                            <div className="text-sm font-semibold text-gray-700 mb-1">{postInfo.fromUser === 'self' ? '自分のポスト' : '相手のポスト'}</div>
                            <p className="text-gray-600 text-sm">開催日: {new Date(postInfo.date).toLocaleDateString('ja-JP')}</p>
                            <p className="text-gray-500 text-xs">作成日時: {formatDateSafe(postInfo.created_at)}</p>
                            <p className="mt-2">{postInfo.message}</p>
                            {postInfo.images.length > 0 && (
                                <div className="mt-2 flex space-x-2 overflow-x-auto">
                                    {postInfo.images.map((img, idx) => (
                                        <img key={idx} src={img} alt={`post_image_${idx}`} className="w-28 h-28 object-cover rounded"/>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* メッセージ */}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`p-3 rounded-xl shadow ${bubbleBg(msg.fromUser)}`}>
                                <div className="text-xs font-semibold text-gray-700 mb-1">{msg.fromUser === 'self' ? '自分' : '相手'}</div>
                                <p className="text-sm font-medium">{msg.type === 'request' ? 'リクエストメッセージ' : msg.type === 'match' ? '承諾メッセージ' : 'DM送信メッセージ'}</p>
                                <p className="mt-1">{msg.message}</p>
                                <div className="text-xs text-gray-500 mt-1">{formatDateSafe(msg.created_at)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
