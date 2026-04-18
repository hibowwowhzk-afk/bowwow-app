// src/app/api/posts/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/firebase-session";
import pool from "@/lib/db";
import { PostRepository } from "@/repositories/PostRepository";
import { RequestRepository } from "@/repositories/RequestRepository";
import { MatchesRepository } from "@/repositories/MatchesRepository";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req: NextRequest) {
    // 1. セッション認証
    const authResult = await verifySessionFromRequest();
    if ("error" in authResult) {
        return NextResponse.json(
            { error: authResult.error },
            { status: authResult.status }
        );
    }

    // 2. postId 取得
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const postIdStr = segments[segments.length - 2];
    const postId = Number(postIdStr);

    if (Number.isNaN(postId)) {
        return NextResponse.json(
            { error: "postId が無効です" },
            { status: 400 }
        );
    }

    /**
     * 3. 既存画像取得（トランザクション外）
     */
    const images = await PostRepository.findPostImagesByPostId(postId);

    /**
     * 4. Cloudinary から削除
     * ※ 更新APIと同じロジック
     */
    for (const img of images) {
        try {
            const filename = img.image_url.split("/").pop();
            if (!filename) continue;

            const publicId = filename.split(".")[0];
            await cloudinary.uploader.destroy(`posts/${publicId}`);
        } catch (e) {
            console.error("Cloudinary delete error:", e);
        }
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        /**
         * 5. posts をキャンセル（論理削除）
         */
        const affected = await PostRepository.cancel(conn, postId);
        if (affected !== 1) {
            throw new Error("キャンセル不可");
        }

        /**
         * 6. 関連データをキャンセル
         */
        await RequestRepository.cancelByPost(conn, postId);
        await MatchesRepository.cancelByPost(conn, postId);

        /**
         * 7. post_images を物理削除
         */
        await PostRepository.deletePostImagesOnCancel(conn, postId);

        await conn.commit();

        return NextResponse.json({ ok: true });
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}
