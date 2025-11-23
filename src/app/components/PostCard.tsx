// components/PostCard.tsx
'use client';

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { Twitter, Instagram } from "lucide-react";
import { JoinRequestButton } from "@/app/components/ui/JoinRequestButton";

type Post = {
    id: number;
    user_id: number;
    message: string;
    date: string;
    user: {
        display_name: string;
        age?: number;
        x_username?: string;
        insta_username?: string;
    };
    images?: { url: string; order: number }[];
};

const noImageUrl =
    "https://dummyimage.com/400x250/cccccc/ffffff&text=No+Image";

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const hasImages = post.images && post.images.length > 0;

    return (
        <li
            style={{
                marginBottom: "2rem",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #ddd",
            }}
        >
            {/* 画像部分 */}
            {hasImages ? (
                <Swiper
                    modules={[Pagination]}
                    pagination={{ clickable: true }}
                    spaceBetween={10}
                    slidesPerView={1}
                    style={{ width: "100%" }}
                >
                    {post.images!.map((img, idx) => (
                        <SwiperSlide key={idx}>
                            <div
                                style={{
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    overflow: "hidden",
                                }}
                            >
                                <img
                                    src={img.url}
                                    alt={`post-${post.id}-image-${idx}`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
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
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        width: "100%",
                        aspectRatio: "1 / 1",
                    }}
                />
            )}

            {/* 情報カード */}
            <div style={{ padding: "1rem", background: "#fff" }}>
                <strong style={{ fontSize: "1.2rem" }}>
                    {post.user.display_name}
                    {post.user.age !== undefined && (
                        <span
                            style={{
                                marginLeft: "0.5rem",
                                fontSize: "1rem",
                                color: "#666",
                            }}
                        >
                            ({post.user.age}歳)
                        </span>
                    )}
                </strong>

                <p
                    style={{
                        margin: "0.5rem 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {post.message}
                </p>

                <small style={{ color: "#666" }}>
                    合流希望日: {new Date(post.date + "T00:00:00+09:00").toLocaleDateString('ja-JP')}
                </small>

                {/* SNSアイコン表示 */}
                <div
                    style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <span
                        style={{
                            fontSize: "0.9rem",
                            color: "#333",
                            fontWeight: 500,
                        }}
                    >
                        連絡SNS:
                    </span>
                    {post.user.x_username && <Twitter size={20} />}
                    {post.user.insta_username && <Instagram size={20} />}
                </div>

                {/* リクエストボタン */}
                <div style={{ marginTop: "1rem" }}>
                    <JoinRequestButton toUserId={post.user_id} postId={post.id} />
                </div>
            </div>
        </li>
    );
};