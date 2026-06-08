'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ConversationModalFromMatching from '@/app/components/ui/ConversationModalFromMatching';
import ProfileModal from '@/app/components/ui/ProfileModal';

type MatchedUser = {
    match_id: number;
    post_date: string;
    matched_at: string;
    match_message: string | null;

    dm_notify_message: string | null;
    dm_notify_sent_at?: string | null;

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

    // =========================
    // 追加：キャンセル処理状態
    // =========================
    const [cancelingId, setCancelingId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const searchParams = useSearchParams();
    const router = useRouter();

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
                if (!resFromMe.ok || !resFromOthers.ok) throw new Error();
            } catch {
                setError('マッチング情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        }
        fetchMatchings();
    }, []);

    const currentList = activeTab === 'fromMe' ? matchingsFromMe : matchingsFromOthers;

    // =========================
    // KYCチェック
    // =========================
    const checkKyc = async (): Promise<boolean> => {
        try {
            const res = await fetch('/api/kyc/userVerification');
            const data = await res.json();

            if (!data.verified) {
                router.push('/kyc');
                return false;
            }

            return true;
        } catch {
            router.push('/kyc');
            return false;
        }
    };

    // =========================
    // SNS表示
    // =========================
    async function handleShowSNS(user: MatchedUser) {
        const ok = await checkKyc();
        if (!ok) return;

        if (snsAccountsMap[user.match_id]) {
            setOpenSNSId(user.match_id);
            return;
        }

        setLoadingSNS(user.match_id);

        try {
            const targetUserId =
                user.from_user_id === user.self_user_id ? user.to_user_id : user.from_user_id;

            const res = await fetch(`/api/user/${targetUserId}/getSnsAccounts`);
            if (!res.ok) throw new Error();

            const data: SNSAccounts = await res.json();

            setSnsAccountsMap(prev => ({
                ...prev,
                [user.match_id]: data,
            }));

            setOpenSNSId(user.match_id);
        } catch {
            alert('SNSアカウント取得に失敗しました');
        } finally {
            setLoadingSNS(null);
        }
    }

    // =========================
    // DMモーダル
    // =========================
    async function handleOpenDMModal(matchId: number) {
        const ok = await checkKyc();
        if (!ok) return;

        setShowDMModal(matchId);
    }

    // =========================
    // 追加：マッチングキャンセル
    // =========================
    async function handleCancelMatch(matchId: number) {
        if (!confirm('このマッチングをキャンセルしますか？')) return;

        setCancelingId(matchId);

        try {
            const res = await fetch(`/api/matchings/${matchId}/cancel`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                let errorMessage = 'キャンセルに失敗しました';

                switch (data.error) {
                    case 'FORBIDDEN':
                        errorMessage = '権限がありません';
                        break;
                    case 'MATCH_NOT_FOUND':
                        errorMessage = 'マッチングが見つかりません';
                        break;
                    case 'ALREADY_CANCELED':
                        errorMessage = 'すでにキャンセル済みです';
                        break;
                    case 'INVALID_MATCH_ID':
                        errorMessage = '不正なマッチIDです';
                        break;
                    default:
                        errorMessage = data.error || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // UI即時反映（UX維持）
            setMatchingsFromMe(prev =>
                prev.filter(m => m.match_id !== matchId)
            );

            setMatchingsFromOthers(prev =>
                prev.filter(m => m.match_id !== matchId)
            );

            alert('キャンセルしました');
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCancelingId(null);
        }
    }

    function formatDateSafe(dateStr?: string | null) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">
                マッチングリスト
            </h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* タブ */}
            <div className="flex mb-6 border-b border-gray-300">
                <button
                    onClick={() => setActiveTab('fromMe')}
                    className={`flex-1 py-2 ${
                        activeTab === 'fromMe'
                            ? 'border-b-2 border-blue-600 font-bold'
                            : 'text-gray-500'
                    }`}
                >
                    自分から
                </button>

                <button
                    onClick={() => setActiveTab('fromOthers')}
                    className={`flex-1 py-2 ${
                        activeTab === 'fromOthers'
                            ? 'border-b-2 border-blue-600 font-bold'
                            : 'text-gray-500'
                    }`}
                >
                    相手から
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">読み込み中...</p>
            ) : (
                <ul className="space-y-4">
                    {currentList.length === 0 ? (
                        <li className="text-gray-500">
                            マッチングはありません
                        </li>
                    ) : (
                        currentList.map(user => {
                            const sns = snsAccountsMap[user.match_id];
                            const isLoading = loadingSNS === user.match_id;
                            const isSNSOpen = openSNSId === user.match_id;
                            const isDMNotified = !!user.dm_notify_message;
                            const isCanceling = cancelingId === user.match_id;

                            return (
                                <li
                                    key={user.match_id}
                                    className={`p-4 border rounded-lg shadow-sm ${
                                        user.match_id === highlightIdNum
                                            ? 'border-red-500 bg-red-50'
                                            : 'bg-white'
                                    }`}
                                >
                                    {/* 画像 */}
                                    <div className="w-full aspect-square mb-4 overflow-hidden rounded-lg">
                                        {user.user_profile_image ? (
                                            <img
                                                src={user.user_profile_image}
                                                alt={user.user_display_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-4xl text-white">
                                                {user.user_display_name[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* ユーザー名 + メニュー */}
                                    <div className="flex justify-between items-start mb-4 relative">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {user.user_display_name}
                                        </h2>

                                        <button
                                            onClick={() =>
                                                setOpenMenuId(
                                                    openMenuId === user.match_id
                                                        ? null
                                                        : user.match_id
                                                )
                                            }
                                            className="text-2xl leading-none px-2 text-gray-500"
                                        >
                                            ⋮
                                        </button>

                                        {openMenuId === user.match_id && (
                                            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 min-w-[180px] overflow-hidden">
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/reports?type=match&id=${user.match_id}`
                                                        )
                                                    }
                                                    className="block w-full text-left px-4 py-3 hover:bg-gray-100"
                                                >
                                                    通報する
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setOpenMenuId(null);
                                                        handleCancelMatch(user.match_id);
                                                    }}
                                                    disabled={isCanceling}
                                                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100"
                                                >
                                                    {isCanceling
                                                        ? 'キャンセル中...'
                                                        : 'マッチングキャンセル'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* ボタン */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setOpenConversationId(user.match_id)}
                                            className="w-full py-2 bg-blue-500 text-white rounded"
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
                                            className="w-full py-2 bg-gray-500 text-white rounded"
                                        >
                                            プロフィール
                                        </button>

                                        <button
                                            onClick={() => handleShowSNS(user)}
                                            disabled={isLoading}
                                            className="w-full py-2 bg-green-500 text-white rounded"
                                        >
                                            SNSアカウント表示
                                        </button>

                                        {!isDMNotified && (
                                            <button
                                                onClick={() => handleOpenDMModal(user.match_id)}
                                                className="w-full py-2 bg-yellow-500 text-white rounded"
                                            >
                                                DM送信を相手に知らせる
                                            </button>
                                        )}
                                    </div>

                                    {/* メッセージ */}
                                    {user.match_message && (
                                        <div className="mt-4 text-sm">
                                            <p className="text-gray-500">
                                                {formatDateSafe(user.matched_at)}
                                            </p>

                                            <p className="text-green-700 font-medium mt-1">
                                                承諾メッセージ
                                            </p>

                                            <p>{user.match_message}</p>

                                            {user.dm_notify_message && (
                                                <div className="mt-2 text-sm">
                                                    {user.dm_notify_sent_at && (
                                                        <p className="text-gray-500">
                                                            {formatDateSafe(user.dm_notify_sent_at)}
                                                        </p>
                                                    )}
                                                    <p className="text-blue-600 font-medium mt-1">
                                                        DM通知メッセージ
                                                    </p>
                                                    <p>{user.dm_notify_message}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isSNSOpen && sns && (
                                        <SNSModal sns={sns} onClose={() => setOpenSNSId(null)} />
                                    )}

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

            <ProfileModal
                userId={selectedUserId}
                source="matches"
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
        </div>
    );
}

/* ---------- SNS Modal ---------- */
function SNSModal({ sns, onClose }: { sns: SNSAccounts; onClose: () => void }) {
    const hasTwitter = !!sns.twitter;
    const hasInstagram = !!sns.instagram;

    if (!hasTwitter && !hasInstagram) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">SNSアカウント</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="space-y-2 text-sm">
                    <p className="text-yellow-800 font-semibold">
                        注意: SNSアカウントは承諾済みの場合のみ表示されます。
                    </p>

                    {hasTwitter && (
                        <p>
                            Twitter:{' '}
                            <a
                                href={`https://twitter.com/${sns.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                @{sns.twitter}
                            </a>
                        </p>
                    )}

                    {hasInstagram && (
                        <p>
                            Instagram:{' '}
                            <a
                                href={`https://instagram.com/${sns.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 underline"
                            >
                                @{sns.instagram}
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- DM Modal ---------- */
function DMNotifyModal({ matchId, onClose }: { matchId: number; onClose: () => void }) {
    const [message, setMessage] = useState('DM送信しました。よろしくお願いします。');
    const [sending, setSending] = useState(false);

    async function handleSend() {
        setSending(true);

        try {
            const res = await fetch(
                `/api/matchings/${matchId}/notifySnsMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                let errorMessage = '送信に失敗しました';

                switch (data.error) {
                    case 'MESSAGE_REQUIRED':
                        errorMessage = 'メッセージを入力してください';
                        break;
                    case 'MESSAGE_TOO_LONG':
                        errorMessage = 'メッセージは200文字以内で入力してください';
                        break;
                    case 'FORBIDDEN':
                        errorMessage = 'このマッチングに対して権限がありません';
                        break;
                    case 'MATCH_NOT_FOUND':
                        errorMessage = 'マッチングが見つかりません';
                        break;
                    case 'USER_NOT_FOUND':
                        errorMessage = 'ユーザー情報が見つかりません';
                        break;
                    case 'ALREADY_NOTIFIED':
                        errorMessage = 'すでにDM通知は送信済みです';
                        break;
                    case 'INVALID_MATCH_ID':
                        errorMessage = '不正なマッチIDです';
                        break;
                    case 'INTERNAL_SERVER_ERROR':
                        errorMessage = 'サーバーエラーが発生しました';
                        break;
                }

                throw new Error(errorMessage);
            }

            alert('送信しました');
            onClose();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg max-w-md w-full">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <textarea
                    className="w-full border p-2 mb-3"
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />

                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="bg-yellow-500 text-white px-4 py-2 rounded"
                >
                    {sending ? '送信中...' : '送信'}
                </button>
            </div>
        </div>
    );
}