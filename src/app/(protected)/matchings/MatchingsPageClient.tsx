
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import MatchingConversation from '@/app/components/ui/MatchingConversation';
import ProfileModal from '@/app/components/ui/ProfileModal';

import {
    ArrowLeftIcon,
    EllipsisVerticalIcon,
    ChatBubbleLeftRightIcon,
    UserCircleIcon,
    LinkIcon,
    FlagIcon,
    XMarkIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

type MatchedUser = {
    match_id: number;
    post_date: string;
    matched_at: string;
    match_message: string | null;

    last_message: string | null;
    last_message_at: string | null;

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

// =========================
// マッチング重複除去
// =========================
function uniqueMatchings(list: MatchedUser[]): MatchedUser[] {
    const map = new Map<number, MatchedUser>();

    for (const user of list) {
        if (!map.has(user.match_id)) {
            map.set(user.match_id, user);
        }
    }

    return Array.from(map.values());
}

export default function MatchingsPageClient() {
    const [matchings, setMatchings] = useState<MatchedUser[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [snsAccountsMap, setSnsAccountsMap] = useState<Record<number, SNSAccounts>>({});
    const [loadingSNS, setLoadingSNS] = useState<number | null>(null);
    const [openSNSId, setOpenSNSId] = useState<number | null>(null);

    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [openMenu, setOpenMenu] = useState(false);
    const [cancelingId, setCancelingId] = useState<number | null>(null);

    // 詳細画面の履歴管理
    const detailHistoryPushed = useRef(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    const highlightId = searchParams.get('highlight');
    const highlightIdNum = highlightId ? Number(highlightId) : null;

    // =========================
    // マッチング情報取得
    // =========================
    useEffect(() => {
        async function fetchMatchings() {
            try {
                setLoading(true);
                setError(null);

                const [resFromMe, resFromOthers] = await Promise.all([
                    fetch('/api/matchings/getFromMe'),
                    fetch('/api/matchings/getFromOthers'),
                ]);

                const [dataFromMe, dataFromOthers] = await Promise.all([
                    resFromMe.json(),
                    resFromOthers.json(),
                ]);

                if (!resFromMe.ok || !resFromOthers.ok) {
                    throw new Error('マッチング情報の取得に失敗しました');
                }

                // 2つの一覧を統合
                const combinedList: MatchedUser[] = [
                    ...(dataFromMe.matchingsList || []),
                    ...(dataFromOthers.matchingsList || []),
                ];

                // 重複除去 + 最終やりとり日時の降順
                const sortedList = uniqueMatchings(combinedList).sort(
                    (a, b) => {
                        const dateA = new Date(
                            a.last_message_at || a.matched_at
                        ).getTime();

                        const dateB = new Date(
                            b.last_message_at || b.matched_at
                        ).getTime();

                        return dateB - dateA;
                    }
                );

                setMatchings(sortedList);

            } catch {
                setError('マッチング情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        }

        fetchMatchings();
    }, []);

    // =========================
    // スマホ本体の戻る・進むボタン対応
    // =========================
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const historyMatchId = Number(
                event.state?.matchingDetail
            );

            if (
                Number.isInteger(historyMatchId) &&
                historyMatchId > 0
            ) {
                detailHistoryPushed.current = true;
                setSelectedMatchId(historyMatchId);
            } else {
                detailHistoryPushed.current = false;
                setSelectedMatchId(null);
            }

            setOpenMenu(false);
            setOpenSNSId(null);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // =========================
    // 選択中のマッチング
    // =========================
    const selectedMatch = matchings.find(
        user => user.match_id === selectedMatchId
    );

    // =========================
    // マッチング詳細を開く
    // =========================
    function handleOpenMatching(matchId: number) {
        if (selectedMatchId !== null) return;

        window.history.pushState(
            {
                ...(window.history.state ?? {}),
                matchingDetail: matchId,
            },
            '',
            window.location.href
        );

        detailHistoryPushed.current = true;
        setSelectedMatchId(matchId);
    }

    // =========================
    // KYCチェック
    // =========================
    const checkKyc = async (): Promise<boolean> => {
        try {
            const res = await fetch('/api/kyc/userVerification');

            if (!res.ok) {
                throw new Error();
            }

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
    // 相手のユーザーID取得
    // =========================
    const getTargetUserId = (user: MatchedUser) => {
        return user.from_user_id === user.self_user_id
            ? user.to_user_id
            : user.from_user_id;
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
            const targetUserId = getTargetUserId(user);

            const res = await fetch(
                `/api/user/${targetUserId}/getSnsAccounts`
            );

            if (!res.ok) {
                throw new Error();
            }

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
    // マッチングキャンセル
    // =========================
    async function handleCancelMatch(matchId: number) {
        if (!confirm('このマッチングをキャンセルしますか？')) {
            return;
        }

        setCancelingId(matchId);
        setOpenMenu(false);

        try {
            const res = await fetch(
                `/api/matchings/${matchId}/cancel`,
                {
                    method: 'POST',
                }
            );

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
                        break;
                }

                throw new Error(errorMessage);
            }

            setMatchings(prev =>
                prev.filter(user => user.match_id !== matchId)
            );

            // 詳細画面の履歴も戻す
            if (detailHistoryPushed.current) {
                window.history.back();
            } else {
                setSelectedMatchId(null);
            }

            alert('キャンセルしました');

        } catch (e) {
            alert((e as Error).message);
        } finally {
            setCancelingId(null);
        }
    }

    // =========================
    // 日時表示
    // =========================
    function formatDateSafe(dateStr?: string | null) {
        if (!dateStr) return '';

        const date = new Date(dateStr);

        return isNaN(date.getTime())
            ? '-'
            : date.toLocaleString('ja-JP');
    }

    // =========================
    // 一覧のプレビュー表示
    // =========================
    function getMessagePreview(user: MatchedUser) {
        return user.last_message
            || user.match_message
            || 'マッチングが成立しました';
    }

    // =========================
    // プレビュー日時
    // =========================
    function getMessageDate(user: MatchedUser) {
        return user.last_message_at || user.matched_at;
    }

    // =========================
    // プロフィール表示
    // =========================
    function handleOpenProfile(user: MatchedUser) {
        setSelectedUserId(getTargetUserId(user));
        setIsProfileModalOpen(true);
    }

    // =========================
    // 一覧に戻る
    // =========================
    function handleBackToList() {
        setOpenMenu(false);
        setOpenSNSId(null);

        if (detailHistoryPushed.current) {
            window.history.back();
        } else {
            setSelectedMatchId(null);
        }
    }

    // =========================
    // 一覧画面
    // =========================
    if (!selectedMatchId || !selectedMatch) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-lg px-4 py-6">

                    {/* ヘッダー */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">
                            マッチング
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            マッチングした相手とのやりとりを確認できます
                        </p>
                    </div>

                    {/* エラー */}
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4">
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* 読み込み中 */}
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                            <p className="text-sm text-slate-500">
                                読み込み中...
                            </p>
                        </div>
                    ) : matchings.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                <ChatBubbleLeftRightIcon className="h-7 w-7 text-slate-400" />
                            </div>

                            <p className="font-semibold text-slate-700">
                                マッチングはありません
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                マッチングが成立すると、ここに表示されます
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {matchings.map((user, index) => {
                                const isHighlighted =
                                    user.match_id === highlightIdNum;

                                return (
                                    <button
                                        key={user.match_id}
                                        type="button"
                                        onClick={() =>
                                            handleOpenMatching(user.match_id)
                                        }
                                        className={`flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 ${
                                            index !== matchings.length - 1
                                                ? 'border-b border-slate-100'
                                                : ''
                                        } ${
                                            isHighlighted
                                                ? 'bg-blue-50'
                                                : ''
                                        }`}
                                    >
                                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200">
                                            {user.user_profile_image ? (
                                                <img
                                                    src={user.user_profile_image}
                                                    alt={user.user_display_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-500">
                                                    {user.user_display_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <p className="truncate font-semibold text-slate-900">
                                                    {user.user_display_name}
                                                </p>

                                                <span className="shrink-0 text-xs text-slate-400">
                                                    {formatDateSafe(getMessageDate(user))}
                                                </span>
                                            </div>

                                            <p className="truncate text-sm text-slate-500">
                                                {getMessagePreview(user)}
                                            </p>
                                        </div>

                                        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <ProfileModal
                    userId={selectedUserId}
                    source="matches"
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            </div>
        );
    }

    // =========================
    // マッチング詳細画面
    // =========================
    const sns = snsAccountsMap[selectedMatch.match_id];
    const isSNSOpen = openSNSId === selectedMatch.match_id;
    const isLoadingSNS = loadingSNS === selectedMatch.match_id;
    const isCanceling = cancelingId === selectedMatch.match_id;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-lg">

                {/* 詳細ヘッダー */}
                <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleBackToList}
                            aria-label="一覧に戻る"
                            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>

                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                            {selectedMatch.user_profile_image ? (
                                <img
                                    src={selectedMatch.user_profile_image}
                                    alt={selectedMatch.user_display_name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center font-bold text-slate-500">
                                    {selectedMatch.user_display_name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-slate-900">
                                {selectedMatch.user_display_name}
                            </p>
                            <p className="text-xs text-green-600">
                                マッチング成立
                            </p>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setOpenMenu(prev => !prev)}
                                aria-label="メニュー"
                                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                            >
                                <EllipsisVerticalIcon className="h-6 w-6" />
                            </button>

                            {openMenu && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="メニューを閉じる"
                                        className="fixed inset-0 z-40 cursor-default"
                                        onClick={() => setOpenMenu(false)}
                                    />

                                    <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOpenMenu(false);
                                                router.push(
                                                    `/reports?type=match&id=${selectedMatch.match_id}`
                                                );
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <FlagIcon className="h-5 w-5 text-slate-400" />
                                            通報する
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCancelMatch(selectedMatch.match_id)
                                            }
                                            disabled={isCanceling}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                            {isCanceling
                                                ? 'キャンセル中...'
                                                : 'マッチングキャンセル'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-4 py-5">

                    {/* 共通トークコンポーネント */}
                    <MatchingConversation
                        matchId={selectedMatch.match_id}
                    />

                    {/* 相手とのアクション */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <h2 className="text-sm font-bold text-slate-800">
                                相手の情報・連絡
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleOpenProfile(selectedMatch)}
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
                        >
                            <UserCircleIcon className="h-6 w-6 text-slate-500" />

                            <span className="flex-1 text-sm font-medium text-slate-700">
                                プロフィールを見る
                            </span>

                            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleShowSNS(selectedMatch)}
                            disabled={isLoadingSNS}
                            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <LinkIcon className="h-6 w-6 text-slate-500" />

                            <span className="flex-1 text-sm font-medium text-slate-700">
                                {isLoadingSNS
                                    ? 'SNSアカウント取得中...'
                                    : 'SNSアカウントを表示'}
                            </span>

                            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
                        </button>
                    </div>

                    {/* SNS表示済みの場合 */}
                    {isSNSOpen && sns && (
                        <SNSModal
                            sns={sns}
                            onClose={() => setOpenSNSId(null)}
                        />
                    )}
                </div>
            </div>

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
function SNSModal({
    sns,
    onClose,
}: {
    sns: SNSAccounts;
    onClose: () => void;
}) {
    const hasTwitter = !!sns.twitter;
    const hasInstagram = !!sns.instagram;

    if (!hasTwitter && !hasInstagram) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={e => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                        SNSアカウント
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="閉じる"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4 rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                    <p className="text-sm font-medium leading-6 text-yellow-800">
                        注意：SNSアカウントはマッチング成立後のみ表示されます。
                    </p>
                </div>

                <div className="space-y-3">
                    {hasTwitter && (
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                            <span className="text-sm font-semibold text-slate-600">
                                X
                            </span>

                            <a
                                href={`https://x.com/${sns.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-sm font-medium text-blue-600 hover:underline"
                            >
                                @{sns.twitter}
                            </a>
                        </div>
                    )}

                    {hasInstagram && (
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                            <span className="text-sm font-semibold text-slate-600">
                                Instagram
                            </span>

                            <a
                                href={`https://instagram.com/${sns.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-sm font-medium text-pink-600 hover:underline"
                            >
                                @{sns.instagram}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
