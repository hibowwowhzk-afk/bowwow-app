
'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Instagram } from 'lucide-react';
import {
    CalendarDaysIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

import { JoinRequestButton } from '@/app/components/ui/JoinRequestButton';

import 'swiper/css';
import 'swiper/css/pagination';

type Post = {
    id?: number;
    user_id: number;
    message: string;
    date: string;
    user?: {
        display_name?: string;
        age?: number;
        x_username?: string;
        insta_username?: string;
    };
    images?: {
        url: string;
        order: number;
    }[];
};

type RequestInfo = {
    count: number;
    limit: number;
    remaining: number;
};

const noImageUrl =
    'https://dummyimage.com/400x400/e2e8f0/64748b&text=No+Image';

let requestCache: RequestInfo | null = null;
let requestPromise: Promise<RequestInfo> | null = null;

const fetchRequestInfo = async (): Promise<RequestInfo> => {
    if (requestCache) {
        return requestCache;
    }

    if (!requestPromise) {
        requestPromise = fetch('/api/requests/getRequestCount')
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error('リクエスト情報の取得に失敗しました');
                }

                return res.json();
            })
            .then((data) => {
                requestCache = data;
                return data;
            })
            .catch((error) => {
                requestPromise = null;
                throw error;
            });
    }

    return requestPromise;
};

// Xのロゴ
const XIcon = ({ className = 'w-5 h-5' }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.5L5.4 22H2.2l7.3-8.4L1.8 2h6.5l4.5 6.9L18.9 2zM17.8 19.8h1.7L7.3 4.1H5.5z" />
        </svg>
    );
};

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const [requestInfo, setRequestInfo] =
        useState<RequestInfo | null>(requestCache);

    const [requestError, setRequestError] = useState(false);

    const hasImages = !!post.images && post.images.length > 0;

    const sortedImages = [...(post.images ?? [])].sort(
        (a, b) => a.order - b.order
    );

    useEffect(() => {
        let active = true;

        fetchRequestInfo()
            .then((data) => {
                if (active) {
                    setRequestInfo(data);
                    setRequestError(false);
                }
            })
            .catch((error) => {
                console.error(error);

                if (active) {
                    setRequestError(true);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const formatDate = (date: string) => {
        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const xUsername = post.user?.x_username?.replace(/^@/, '');
    const instaUsername = post.user?.insta_username?.replace(/^@/, '');

    return (
        <li className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">

            {/* 画像 */}
            <div className="relative w-full overflow-hidden bg-slate-100">

                {hasImages ? (
                    <Swiper
                        modules={[Pagination]}
                        pagination={{ clickable: true }}
                        spaceBetween={0}
                        slidesPerView={1}
                        className="post-card-swiper w-full"
                    >
                        {sortedImages.map((img, idx) => (
                            <SwiperSlide key={`${img.url}-${idx}`}>
                                <div className="aspect-square w-full">
                                    <img
                                        src={img.url}
                                        alt={`募集画像 ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className="aspect-square w-full">
                        <img
                            src={noImageUrl}
                            alt="画像なし"
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                {/* 募集日 */}
                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {formatDate(post.date)}
                </div>
            </div>

            {/* 投稿内容 */}
            <div className="p-4">

                {/* ユーザー情報 */}
                <div className="mb-3 flex items-center gap-2">
                    <UserCircleIcon className="h-10 w-10 shrink-0 text-slate-400" />

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900">
                                {post.user?.display_name ?? '名無し'}
                            </span>

                            {post.user?.age !== undefined && (
                                <span className="text-sm text-slate-500">
                                    {post.user.age}歳
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-slate-500">
                            合コンメンバー募集中
                        </p>
                    </div>
                </div>

                {/* メッセージ */}
                <p className="mb-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
                    {post.message}
                </p>

                {/* SNS */}
                {(post.user?.x_username || post.user?.insta_username) && (
                    <div className="mb-4 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                            マッチング後に連絡可能なSNS
                        </p>

                        <div className="flex flex-wrap items-center gap-2">

                            {post.user?.x_username && (
                                <div
                                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600"
                                    aria-label="X対応"
                                >
                                    <XIcon className="h-4 w-4" />
                                    <span>X</span>
                                </div>
                            )}

                            {post.user?.insta_username && (
                                <div
                                    className="flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3 py-2 text-sm font-medium text-pink-600"
                                    aria-label="Instagram対応"
                                >
                                    <Instagram className="h-4 w-4" />
                                    <span>Instagram</span>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* リクエストボタン */}
                <div className="border-t border-slate-100 pt-4">

                    {requestError ? (
                        <p className="text-center text-sm text-red-500">
                            リクエスト情報を取得できませんでした
                        </p>
                    ) : requestInfo === null ? (
                        <p className="py-2 text-center text-sm text-slate-400">
                            リクエスト状況を確認中...
                        </p>
                    ) : requestInfo.remaining > 0 ? (
                        <JoinRequestButton
                            toUserId={post.user_id}
                            postId={post.id ?? 0}
                        />
                    ) : (
                        <p className="rounded-lg bg-slate-100 py-3 text-center text-sm font-medium text-slate-500">
                            リクエスト上限に達しています
                        </p>
                    )}

                </div>
            </div>
        </li>
    );
};
