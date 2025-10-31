'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type MatchedUser = {
    match_id: number;
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

export default function MatchingsPage() {
    const [matchedUserList, setMatchedUserList] = useState<MatchedUser[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'fromMe' | 'fromOthers'>('fromMe');
    const [modalOpenFor, setModalOpenFor] = useState<number | null>(null);
    const [snsAccountsMap, setSnsAccountsMap] = useState<Record<number, SNSAccounts>>({});
    const [loadingSNS, setLoadingSNS] = useState<number | null>(null);

    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const highlightIdNum = highlightId ? Number(highlightId) : null;

    useEffect(() => {
        async function fetchMatchedUserList() {
            try {
                const res = await fetch('/api/requests/getMatched');
                const data = await res.json();

                if (res.ok) {
                    setMatchedUserList(data.matchedRequestsList || []);
                } else {
                    setError(data.error || 'データの取得に失敗しました');
                }
            } catch {
                setError('ネットワークエラーが発生しました');
            }
        }

        fetchMatchedUserList();
    }, []);

    const filteredList = matchedUserList.filter((user) => {
        if (tab === 'fromMe') {
            return user.from_user_id === user.self_user_id;
        } else {
            return user.to_user_id === user.self_user_id;
        }
    });

    async function handleShowSNS(user: MatchedUser) {
        if (snsAccountsMap[user.match_id]) {
            setModalOpenFor(user.match_id);
            return;
        }

        setLoadingSNS(user.match_id);
        try {
            const targetUserId = user.from_user_id === user.self_user_id
                ? user.to_user_id
                : user.from_user_id;

            const res = await fetch(`/api/user/${targetUserId}/getSnsAccounts`);
            if (!res.ok) throw new Error('SNS情報取得に失敗しました');

            const data: SNSAccounts = await res.json();
            setSnsAccountsMap((prev) => ({ ...prev, [user.match_id]: data }));
            setModalOpenFor(user.match_id);
        } catch {
            alert('SNSアカウントの取得に失敗しました。');
        } finally {
            setLoadingSNS(null);
        }
    }

    function closeModal() {
        setModalOpenFor(null);
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">マッチング一覧</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex mb-6 border-b border-gray-300">
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
                    <li className="text-gray-500">マッチングはありません</li>
                ) : (
                    filteredList.map((user) => {
                        const sns = snsAccountsMap[user.match_id];
                        const isLoading = loadingSNS === user.match_id;

                        return (
                            <li
                                key={user.match_id}
                                className={`flex items-center p-6 border rounded-lg shadow-sm hover:bg-gray-50 ${
                                    user.match_id === highlightIdNum ? 'border-red-500 bg-red-50' : 'bg-white'
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
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-xl font-semibold">{user.user_display_name}</h2>
                                        <span className="text-sm text-gray-500">
                                            {new Date(user.matched_at).toLocaleString()}
                                        </span>
                                    </div>

                                    {user.match_message && (
                                        <div className="mb-2">
                                            <p className="text-sm text-green-700 font-medium">承諾メッセージ:</p>
                                            <p className="text-base text-gray-700">{user.match_message}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleShowSNS(user)}
                                        disabled={isLoading}
                                        className={`mt-3 px-4 py-2 rounded ${
                                            isLoading
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {isLoading ? '読み込み中...' : 'SNSアカウント表示'}
                                    </button>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            {modalOpenFor !== null && (
                <Modal onClose={closeModal}>
                    <SNSDisplay sns={snsAccountsMap[modalOpenFor]} />
                </Modal>
            )}
        </div>
    );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-6 rounded-lg max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                    閉じる
                </button>
            </div>
        </div>
    );
}

function SNSDisplay({ sns }: { sns?: SNSAccounts }) {
    if (!sns) return null; // sns自体がなければ何も表示しない

    // どちらかのアカウントがあるかチェック
    const hasTwitter = !!sns.twitter;
    const hasInstagram = !!sns.instagram;

    if (!hasTwitter && !hasInstagram) return null; // どちらもなければ何も表示しない

    return (
        <div className="space-y-4">
            <div className="p-3 md:p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-sm md:text-base leading-relaxed">
                <strong className="font-semibold">注意:</strong> SNSアカウントは相手が承諾した場合のみ表示されています。  
                不正利用や無断連絡は固く禁止されています。マナーを守ってご利用ください。
            </div>

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
    );
}