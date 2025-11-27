'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ConversationModalFromMatching from '@/app/components/ui/ConversationModalFromMatching';
import ProfileModal from '@/app/components/ui/ProfileModal';

type MatchedUser = {
    match_id: number;
    post_date: string;
    matched_at: string;
    match_message: string | null;
    user_display_name: string;
    user_profile_image: string | null;
    self_user_id: number;
    from_user_id: number;
    to_user_id: number;
};

type SNSAccounts = {
    twitter: string;
    instagram: string;
};

export default function MatchingsPageClient() {
    const [matchingsFromMe, setMatchingsFromMe] = useState<MatchedUser[]>([]);
    const [matchingsFromOthers, setMatchingsFromOthers] = useState<MatchedUser[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'fromMe' | 'fromOthers'>('fromOthers');
    const [snsAccountsMap, setSnsAccountsMap] = useState<Record<number, SNSAccounts>>({});
    const [loadingSNS, setLoadingSNS] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [openConversationId, setOpenConversationId] = useState<number | null>(null);
    const [openSNSId, setOpenSNSId] = useState<number | null>(null);
    const [showDMModal, setShowDMModal] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const highlightIdNum = highlightId ? Number(highlightId) : null;

    useEffect(() => {
        async function fetchMatchings() {
            try {
                setLoading(true);
                const [resFromMe, resFromOthers] = await Promise.all([
                    fetch('/api/matchings/getFromMe'),
                    fetch('/api/matchings/getFromOthers'),
                ]);
                const [dataFromMe, dataFromOthers] = await Promise.all([
                    resFromMe.json(),
                    resFromOthers.json(),
                ]);
                if (resFromMe.ok) setMatchingsFromMe(dataFromMe.matchingsList || []);
                if (resFromOthers.ok) setMatchingsFromOthers(dataFromOthers.matchingsList || []);
                if (!resFromMe.ok || !resFromOthers.ok) throw new Error('一部データ取得に失敗');
            } catch {
                setError('マッチング情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        }
        fetchMatchings();
    }, []);

    const currentList = activeTab === 'fromMe' ? matchingsFromMe : matchingsFromOthers;

    async function handleShowSNS(user: MatchedUser) {
        if (snsAccountsMap[user.match_id]) {
            setOpenSNSId(user.match_id);
            return;
        }
        setLoadingSNS(user.match_id);
        try {
            const targetUserId = user.from_user_id === user.self_user_id ? user.to_user_id : user.from_user_id;
            const res = await fetch(`/api/user/${targetUserId}/getSnsAccounts`);
            if (!res.ok) throw new Error('SNS取得失敗');
            const data: SNSAccounts = await res.json();
            setSnsAccountsMap(prev => ({ ...prev, [user.match_id]: data }));
            setOpenSNSId(user.match_id);
        } catch {
            alert('SNSアカウント取得に失敗しました');
        } finally {
            setLoadingSNS(null);
        }
    }

    function formatDateSafe(dateStr: string) {
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">マッチングリスト</h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* タブ切り替え */}
            <div className="flex mb-6 border-b border-gray-300">
                <button
                    onClick={() => setActiveTab('fromMe')}
                    className={`flex-1 py-2 text-center ${activeTab === 'fromMe' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
                >
                    自分から
                </button>
                <button
                    onClick={() => setActiveTab('fromOthers')}
                    className={`flex-1 py-2 text-center ${activeTab === 'fromOthers' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
                >
                    相手から
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">読み込み中...</p>
            ) : (
                <ul className="space-y-4">
                    {currentList.length === 0 ? (
                        <li className="text-gray-500">マッチングはありません</li>
                    ) : (
                        currentList.map(user => {
                            const sns = snsAccountsMap[user.match_id];
                            const isLoading = loadingSNS === user.match_id;
                            const isSNSOpen = openSNSId === user.match_id;

                            return (
                                <li
                                    key={user.match_id}
                                    className={`flex flex-col p-4 border rounded-lg shadow-sm hover:bg-gray-50 ${user.match_id === highlightIdNum ? 'border-red-500 bg-red-50' : 'bg-white'}`}
                                >
                                    {/* 画像：正方形大きめ */}
                                    <div className="w-full max-w-xs mx-auto mb-4">
                                        <div className="w-full aspect-square overflow-hidden rounded-lg shadow">
                                            {user.user_profile_image ? (
                                                <img
                                                    src={user.user_profile_image}
                                                    alt={user.user_display_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold text-4xl">
                                                    {user.user_display_name[0]}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ボタン縦並び */}
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => setOpenConversationId(user.match_id)}
                                            className="w-full px-4 py-2 text-base bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            やりとり
                                        </button>

                                        <button
                                            onClick={() => {
                                                const otherUserId =
                                                    activeTab === 'fromOthers'
                                                        ? user.from_user_id
                                                        : user.to_user_id;
                                                setSelectedUserId(otherUserId);
                                                setIsProfileModalOpen(true);
                                            }}
                                            className="w-full px-4 py-2 text-base bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            プロフィール
                                        </button>

                                        <button
                                            onClick={() => handleShowSNS(user)}
                                            disabled={isLoading}
                                            className={`w-full px-4 py-2 text-base rounded ${
                                                isLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                        >
                                            {isLoading ? '読み込み中...' : 'SNSアカウント表示'}
                                        </button>

                                        <button
                                            onClick={() => setShowDMModal(user.match_id)}
                                            className="w-full px-4 py-2 text-base bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                        >
                                            DM送信を相手に知らせる
                                        </button>
                                    </div>

                                    {user.match_message && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">
                                                {activeTab === 'fromMe' ? '送信日時' : '受信日時'}: {formatDateSafe(user.matched_at)}
                                            </p>
                                            <p className="text-sm text-green-700 font-medium mt-1">承諾メッセージ:</p>
                                            <p className="text-base text-gray-700">{user.match_message}</p>
                                        </div>
                                    )}

                                    {isSNSOpen && sns && <SNSModal sns={sns} onClose={() => setOpenSNSId(null)} />}
                                    {openConversationId === user.match_id && (
                                        <ConversationModalFromMatching
                                            matchId={user.match_id}
                                            onClose={() => setOpenConversationId(null)}
                                        />
                                    )}
                                    {showDMModal === user.match_id && (
                                        <DMNotifyModal
                                            matchId={user.match_id}
                                            onClose={() => setShowDMModal(null)}
                                        />
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>
            )}

            {/* Profile Modal */}
            <ProfileModal
                userId={selectedUserId}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}

// --- SNS Modal ---
function SNSModal({ sns, onClose }: { sns: SNSAccounts; onClose: () => void }) {
    const hasTwitter = !!sns.twitter;
    const hasInstagram = !!sns.instagram;
    if (!hasTwitter && !hasInstagram) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">SNSアカウント</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="space-y-2 text-sm">
                    <p className="text-yellow-800 font-semibold">
                        注意: SNSアカウントは承諾済みの場合のみ表示されます。マナーを守ってください。
                    </p>
                    {hasTwitter && (
                        <p>
                            Twitter: <a href={`https://twitter.com/${sns.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">@{sns.twitter}</a>
                        </p>
                    )}
                    {hasInstagram && (
                        <p>
                            Instagram: <a href={`https://instagram.com/${sns.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 underline">@{sns.instagram}</a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- DM通知用モーダル ---
function DMNotifyModal({ matchId, onClose }: { matchId: number; onClose: () => void }) {
    const [message, setMessage] = useState('DM送信しました。よろしくお願いします。');
    const [sending, setSending] = useState(false);

    async function handleSend() {
        setSending(true);
        try {
            const res = await fetch(`/api/matchings/${matchId}/notifySnsMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            if (!res.ok) throw new Error('送信失敗');
            alert('メッセージを送信しました');
            onClose();
        } catch (err) {
            console.error(err);
            alert('送信に失敗しました');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">相手に通知するメッセージ</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <textarea
                    className="w-full p-2 border rounded mb-4"
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {sending ? '送信中...' : '送信'}
                </button>
            </div>
        </div>
    );
}
