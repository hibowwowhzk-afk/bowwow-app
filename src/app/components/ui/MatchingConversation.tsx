
'use client';

import React, { useEffect, useState, useRef } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

type MatchingConversationProps = {
    matchId: number;
};

type ConversationData = {
    self_user_id: number;

    post_message: string | null;
    post_date: string | null;
    post_created_at: string | null;
    post_images: string[] | null;
    post_user_id: number | null;

    request_message: string | null;
    request_from_user_id: number | null;
    request_created_at: string | null;

    match_message: string | null;
    match_from_user_id: number | null;
    matched_at: string | null;

    messages: ChatMessage[];
};

type ChatMessage = {
    id: number;
    match_id: number;
    sender_user_id: number;
    message: string;
    created_at: string;
};

type Message = {
    id: string;
    type: 'post' | 'request' | 'approval' | 'normal';
    message: string;
    senderId: number;
    createdAt: string | null;
};

export default function MatchingConversation({
    matchId,
}: MatchingConversationProps) {
    const [conversation, setConversation] =
        useState<ConversationData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');

    // 募集画像の開閉状態
    const [isPostImagesOpen, setIsPostImagesOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // =========================
    // 未読メッセージを既読にする
    // =========================
    const markAsRead = async () => {
        try {
            const res = await fetch(
                `/api/matchings/${matchId}/markAsRead`,
                {
                    method: 'POST',
                }
            );

            if (!res.ok) {
                console.error('既読更新に失敗しました');
            }
        } catch (error) {
            console.error('既読更新エラー:', error);
        }
    };

    // =========================
    // 日付表示
    // =========================
    const formatDate = (date?: string | null) => {
        if (!date) return '';

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return '';

        return parsed.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        });
    };

    // =========================
    // 時刻表示
    // =========================
    const formatTime = (date?: string | null) => {
        if (!date) return '';

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return '';

        return parsed.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // =========================
    // 会話情報取得
    // =========================
    useEffect(() => {
        let cancelled = false;

        async function fetchConversation() {
            setLoading(true);
            setError('');

            try {
                const res = await fetch(
                    `/api/matchings/${matchId}/getConversationFromMatching`
                );

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        data?.error ?? '会話情報の取得に失敗しました'
                    );
                }

                const result = data?.data ?? data;

                if (!result) {
                    throw new Error('会話情報が見つかりません');
                }

                if (!cancelled) {
                    console.log('[Conversation API Response]', result);

                    setConversation({
                        ...result,
                        self_user_id: Number(result.self_user_id),
                        post_user_id:
                            result.post_user_id != null
                                ? Number(result.post_user_id)
                                : null,

                        messages: Array.isArray(result.messages)
                            ? result.messages.map((item: any) => ({
                                  id: Number(item.id),
                                  match_id: Number(item.match_id),
                                  sender_user_id: Number(item.sender_user_id),
                                  message: String(item.message ?? ''),
                                  created_at: item.created_at,
                              }))
                            : [],
                    });

                    // 会話を取得できたら未読メッセージを既読にする
                    await markAsRead();
                }
            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : '会話情報の取得に失敗しました'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchConversation();

        return () => {
            cancelled = true;
        };
    }, [matchId]);

    // =========================
    // メッセージ作成
    // =========================
    const messages: Message[] = conversation
        ? [
            {
                id: 'post',
                type: 'post' as const,
                message: conversation.post_message ?? '',
                senderId: Number(
                    conversation.post_user_id ?? 0
                ),
                createdAt: conversation.post_created_at,
            },
            {
                id: 'request',
                type: 'request' as const,
                message: conversation.request_message ?? '',
                senderId: Number(
                    conversation.request_from_user_id ?? 0
                ),
                createdAt: conversation.request_created_at,
            },
            {
                id: 'approval',
                type: 'approval' as const,
                message: conversation.match_message ?? '',
                senderId: Number(
                    conversation.match_from_user_id ?? 0
                ),
                createdAt: conversation.matched_at,
            },
            ...conversation.messages.map(
                (item): Message => ({
                    id: `normal-${item.id}`,
                    type: 'normal',
                    message: item.message,
                    senderId: Number(item.sender_user_id),
                    createdAt: item.created_at,
                })
            ),
        ].filter((item) => item.message.trim() !== '')
        : [];

    // =========================
    // メッセージ送信数
    // 募集投稿メッセージは含めない
    // =========================
    const messageCount = messages.filter(
        (message) => message.type !== 'post'
    ).length;

    const remainingCount = Math.max(0, 20 - messageCount);
    const canSend = remainingCount > 0;

    // =========================
    // 募集画像
    // =========================
    const postImages = Array.isArray(conversation?.post_images)
        ? conversation.post_images.filter(
              (image): image is string =>
                  typeof image === 'string' && image.length > 0
          )
        : [];

    // =========================
    // メッセージ送信
    // =========================
    const handleSendMessage = async () => {
        const message = inputMessage.trim();

        if (!message || sending || !canSend || !conversation) return;

        if (message.length > 500) {
            setSendError('メッセージは500文字以内で入力してください');
            return;
        }

        setSending(true);
        setSendError('');

        try {
            const res = await fetch(
                `/api/matchings/${matchId}/sendMessage`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(
                    data?.error ?? 'メッセージの送信に失敗しました'
                );
            }

            const newMessage: ChatMessage = {
                id: Number(data.message?.id ?? data.id),
                match_id: matchId,
                sender_user_id: Number(conversation.self_user_id),
                message,
                created_at:
                    data.message?.created_at ??
                    data.created_at ??
                    new Date().toISOString(),
            };

            setConversation((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    messages: [...prev.messages, newMessage],
                };
            });

            setInputMessage('');

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                });
            }, 100);
        } catch (err) {
            console.error(err);

            setSendError(
                err instanceof Error
                    ? err.message
                    : 'メッセージの送信に失敗しました'
            );
        } finally {
            setSending(false);
        }
    };

    // =========================
    // 読み込み中
    // =========================
    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="text-sm text-slate-500">
                    トークを読み込んでいます...
                </p>
            </div>
        );
    }

    // =========================
    // エラー
    // =========================
    if (error || !conversation) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-red-600">
                    {error || '会話情報を取得できませんでした'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* =========================
                メッセージ
            ========================= */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf0f6] shadow-sm">

                <div className="border-b border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-bold text-slate-800">
                        メッセージ
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                        マッチング相手とのやりとり
                    </p>
                </div>

                {/* メッセージ残数 */}
                <div className="border-b border-slate-200 bg-white/70 px-4 py-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            メッセージ送信数
                        </p>
                        <p className="text-xs font-semibold text-slate-600">
                            {messageCount} / 20
                        </p>
                    </div>

                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full rounded-full ${
                                messageCount >= 20
                                    ? 'bg-red-400'
                                    : 'bg-blue-500'
                            }`}
                            style={{
                                width: `${Math.min(100, (messageCount / 20) * 100)}%`,
                            }}
                        />
                    </div>

                    {messageCount >= 15 && messageCount < 20 && (
                        <p className="mt-2 text-xs text-amber-600">
                            あと{remainingCount}件送信できます。SNS交換を検討してみましょう。
                        </p>
                    )}

                    {messageCount >= 20 && (
                        <p className="mt-2 text-xs text-red-500">
                            メッセージの上限20件に達しました。
                        </p>
                    )}
                </div>

                {/* トーク履歴 */}
                <div className="space-y-5 px-3 py-5 sm:px-4">

                    {messages.length === 0 && (
                        <p className="py-6 text-center text-sm text-slate-400">
                            メッセージはありません
                        </p>
                    )}

                    {messages.map((message) => {
                        const isMine =
                            Number(message.senderId) ===
                            Number(conversation.self_user_id);

                        return (
                            <div key={message.id}>

                                {/* 募集投稿メッセージ */}
                                {message.type === 'post' && (
                                    <div className="mb-3 text-center">
                                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm">
                                            募集投稿
                                            {conversation.post_date
                                                ? ` ・ ${formatDate(conversation.post_date)} 開催`
                                                : ''}
                                        </span>
                                    </div>
                                )}

                                {(message.type === 'request' ||
                                    message.type === 'approval') && (
                                    <div className="mb-3 text-center">
                                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm">
                                            {message.type === 'request'
                                                ? 'リクエスト'
                                                : 'マッチング承認'}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`flex items-end gap-2 ${
                                        isMine
                                            ? 'justify-end'
                                            : 'justify-start'
                                    }`}
                                >
                                    <div className="max-w-[82%]">
                                        <div
                                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                                                isMine
                                                    ? 'rounded-br-sm bg-[#95ec69] text-slate-800'
                                                    : 'rounded-bl-sm border border-slate-100 bg-white text-slate-800'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                                {message.message}
                                            </p>
                                        </div>

                                        <p
                                            className={`mt-1 text-[10px] text-slate-400 ${
                                                isMine
                                                    ? 'text-right'
                                                    : 'text-left'
                                            }`}
                                        >
                                            {formatTime(message.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} />
                </div>

                {/* メッセージ入力欄 */}
                <div className="border-t border-slate-200 bg-white p-3">

                    {sendError && (
                        <p className="mb-2 text-xs text-red-500">
                            {sendError}
                        </p>
                    )}

                    <div className="flex items-end gap-2">

                        <div className="min-w-0 flex-1">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => {
                                    setInputMessage(e.target.value);
                                    setSendError('');
                                }}
                                maxLength={500}
                                rows={1}
                                disabled={!canSend || sending}
                                placeholder={
                                    canSend
                                        ? 'メッセージを入力...'
                                        : '送信上限に達しました'
                                }
                                className="max-h-32 min-h-11 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white disabled:bg-slate-100"
                            />

                            <p className="mt-1 text-right text-[10px] text-slate-400">
                                {inputMessage.length} / 500文字
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={
                                !inputMessage.trim() ||
                                sending ||
                                !canSend
                            }
                            aria-label="送信"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {sending ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-5 w-5"
                                >
                                    <path
                                        d="M22 2 11 13"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="m22 2-7 20-4-9-9-4 20-7Z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* =========================
                募集投稿
            ========================= */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* 募集投稿タイトル＋開催日 */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold text-slate-800">
                        募集投稿
                    </p>

                    {conversation.post_date && (
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                            {formatDate(conversation.post_date)} 開催
                        </span>
                    )}
                </div>

                {/* 募集画像（折りたたみ） */}
                <div className="border-b border-slate-100">
                    <button
                        type="button"
                        onClick={() =>
                            setIsPostImagesOpen((prev) => !prev)
                        }
                        aria-expanded={isPostImagesOpen}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                募集画像
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {postImages.length > 0
                                    ? `${postImages.length}枚の画像`
                                    : '画像はありません'}
                            </p>
                        </div>

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className={`h-5 w-5 text-slate-500 transition-transform ${
                                isPostImagesOpen ? 'rotate-180' : ''
                            }`}
                        >
                            <path
                                d="m6 9 6 6 6-6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {isPostImagesOpen && (
                        <div className="bg-slate-50">
                            {postImages.length > 0 ? (
                                <Swiper
                                    modules={[Pagination]}
                                    pagination={{ clickable: true }}
                                    slidesPerView={1}
                                    spaceBetween={0}
                                    className="w-full"
                                >
                                    {postImages.map((image, index) => (
                                        <SwiperSlide key={`${image}-${index}`}>
                                            <div className="aspect-square w-full">
                                                <img
                                                    src={image}
                                                    alt={`募集画像 ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <div className="flex h-32 w-full items-center justify-center">
                                    <p className="text-sm text-slate-400">
                                        画像はありません
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 募集投稿メッセージ（常時表示） */}
                <div className="p-4">

                    <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-500">
                            募集投稿メッセージ
                        </p>

                        {conversation.post_created_at && (
                            <p className="shrink-0 text-xs text-slate-400">
                                投稿日時：
                                {formatDate(conversation.post_created_at)}
                            </p>
                        )}
                    </div>

                    <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                        {conversation.post_message ||
                            '投稿メッセージはありません'}
                    </p>
                </div>
            </section>
        </div>
    );
}
