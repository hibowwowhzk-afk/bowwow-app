'use client';

import React, { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import { PostCard } from '@/app/components/PostCard';

type Post = {
    id: number;
    user_id: number;
    message: string;
    date: string;
    user: {
        display_name: string;
        age: number;
        x_username?: string;
        insta_username?: string;
    };
    images?: { url: string; order: number }[];
};

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
        <ul style={{ listStyle: "none", padding: 0 }}>
        {posts.map((post) => (
            <PostCard key={post.id} post={post} />
        ))}
        </ul>
        </section>
    );
};