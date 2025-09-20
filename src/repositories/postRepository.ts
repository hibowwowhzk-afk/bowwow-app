// src/repositories/postRepository.ts
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export type PostRow = {
    post_id: number;
    user_id: string;
    message: string;
    created_at: string; // DB の型に合わせて string or Date
    display_name: string;
    x_username?: string | null;
    insta_username?: string | null;
    image_url?: string | null;
    image_order?: number | null;
};
/**
 * 「今すぐ飲みたい」状態のアクティブな投稿をランダムに取得します。
 * - 投稿者の性別が `genderNum` と異なるユーザーのみ対象。
 * - 投稿者が自分（`uid`）である投稿は除外。
 * - 投稿に紐づく画像（複数可）を含めて返却します。
 *
 * @param genderNum - 除外したい性別（例: 自分の性別を除外）
 * @param uid - 除外したいユーザーID（自分自身の投稿を除外）
 * @returns 投稿の配列（各投稿には画像情報を含む）
 */
export class PostRepository {
    static async findImmediateActivePosts(genderNum: number, uid: string): Promise<PostRow[]> {
        const [rows] = await db.query(`
            SELECT
                p.id AS post_id,
                p.user_id,
                p.message,
                p.created_at,
                u.display_name,
                u.x_username,
                u.insta_username,
                i.image_url,
                i.order AS image_order
            FROM posts p
            JOIN user_profile u ON p.user_id = u.user_id
            LEFT JOIN post_images i ON p.id = i.post_id
            WHERE p.is_immediate = 1
                AND p.status = 'active'
                AND p.user_id != ?
                AND u.gender != ?
            ORDER BY p.created_at DESC, i.order ASC
            LIMIT 50
        `, [uid, genderNum]);

        return rows as PostRow[];
    }
}