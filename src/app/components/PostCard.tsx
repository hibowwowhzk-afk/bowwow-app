'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { Twitter, Instagram } from 'lucide-react';
import { JoinRequestButton } from '@/app/components/ui/JoinRequestButton';

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
    images?: { url: string; order: number }[];
};

type RequestInfo = {
    count: number;
    limit: number;
    remaining: number;
};

const noImageUrl =
    'https://dummyimage.com/400x250/cccccc/ffffff&text=No+Image';

let requestCache: RequestInfo | null = null;
let requestPromise: Promise<RequestInfo> | null = null;

const fetchRequestInfo = async (): Promise<RequestInfo> => {
    if (requestCache) return requestCache;

    if (!requestPromise) {
        requestPromise = fetch('/api/requests/getRequestCount')
            .then(res => res.json())
            .then(data => {
                requestCache = data;
                return data;
            });
    }

    return requestPromise;
};

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const hasImages = post.images && post.images.length > 0;

    const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);

    useEffect(() => {
        fetchRequestInfo().then(setRequestInfo);
    }, []);

    return (
        <li
            style={{
                marginBottom: '2rem',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #ddd',
            }}
        >
            {/* 画像 */}
            {hasImages ? (
                <Swiper
                    modules={[Pagination]}
                    pagination={{ clickable: true }}
                    spaceBetween={10}
                    slidesPerView={1}
                    style={{ width: '100%' }}
                >
                    {post.images!.map((img, idx) => (
                        <SwiperSlide key={idx}>
                            <div
                                style={{
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    overflow: 'hidden',
                                }}
                            >
                                <img
                                    src={img.url}
                                    alt={`post-${post.id ?? 'unknown'}-image-${idx}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            ) : (
                <div
                    style={{
                        backgroundImage: `url(${noImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '100%',
                        aspectRatio: '1 / 1',
                    }}
                />
            )}

            {/* 情報 */}
            <div style={{ padding: '1rem', background: '#fff' }}>
                <strong style={{ fontSize: '1.2rem' }}>
                    {post.user?.display_name ?? '名無し'}
                    {post.user?.age !== undefined && (
                        <span
                            style={{
                                marginLeft: '0.5rem',
                                fontSize: '1rem',
                                color: '#666',
                            }}
                        >
                            ({post.user.age}歳)
                        </span>
                    )}
                </strong>

                <p
                    style={{
                        margin: '0.5rem 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {post.message}
                </p>

                <small style={{ color: '#666' }}>
                    合流希望日: {new Date(post.date).toLocaleDateString('ja-JP')}
                </small>

                {/* SNS */}
                <div
                    style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '0.9rem' }}>連絡SNS:</span>
                    {post.user?.x_username && <Twitter size={20} />}
                    {post.user?.insta_username && <Instagram size={20} />}
                </div>

                {/* ボタン or 制限表示 */}
                <div style={{ marginTop: '1rem' }}>
                    {requestInfo && requestInfo.remaining > 0 ? (
                        <JoinRequestButton
                            toUserId={post.user_id}
                            postId={post.id ?? 0}
                        />
                    ) : (
                        <small style={{ color: '#999' }}>
                            リクエスト上限に達しています
                        </small>
                    )}
                </div>
            </div>
        </li>
    );
};