'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

type Post = {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: {
        display_name: string;
    };
    images?: { url: string; order: number }[];
};

const noImageUrl = 'https://dummyimage.com/400x250/cccccc/ffffff&text=No+Image';

export const ImmediateDrinks: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchImmediatePosts() {
        const res = await fetch('/api/posts/immediate');
        if (res.ok) {
            const data = await res.json();
            setPosts(data);
        }
        setLoading(false);
        }
        fetchImmediatePosts();
    }, []);

    if (loading) return <p>読み込み中...</p>;
    if (posts.length === 0) return <p>今すぐ飲みたい人はいません。</p>;

    return (
        <section>
        <h2>今すぐ合流できる人</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {posts.map((post) => {
            const hasImages = post.images && post.images.length > 0;
            const fallbackImage = noImageUrl;

            return (
                <li
                key={post.id}
                style={{
                    marginBottom: '2rem',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                }}
                >
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
                            alt={`post-${post.id}-image-${idx}`}
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
                        backgroundImage: `url(${fallbackImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '100%',
                        aspectRatio: '1 / 1',
                    }}
                    />
                )}

                {/* オーバーレイとテキスト */}
                <div
                    style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    zIndex: 1,
                    color: '#fff',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '0.5rem 1rem',
                    borderRadius: 4,
                    }}
                >
                    <strong style={{ fontSize: '1.2rem' }}>{post.user.display_name}</strong>
                    <br />
                    <span>{post.message}</span>
                    <br />
                    <small style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    投稿日時: {new Date(post.created_at).toLocaleString()}
                    </small>
                </div>
                </li>
            );
            })}
        </ul>
        </section>
    );
    };