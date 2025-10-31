// src/repositories/postRepository.ts
import db from '@/lib/db';

export type PostRow = {
    post_id: number;
    user_id: string;
    message: string;
    age: number;
    created_at: string; // DB の型に合わせて string or Date
    display_name: string;
    x_username?: string | null;
    insta_username?: string | null;
    image_url?: string | null;
    image_order?: number | null;
};

export type PostSearchParams = {
    ageFrom?: number;
    ageTo?: number;
    dateFrom?: Date;
    dateTo?: Date;
    keywords?: string[];
    isImmediate?: boolean;
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
                u.age,
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

    /**
     * 検索条件に基づいて投稿を取得し、自分と同性の投稿を除外する
     * @param params 検索条件
     * @param excludeUserId 除外するユーザーID（自分自身）
     * @param excludeGender 除外する性別（自分の性別）
     */
    static async searchPosts(params: PostSearchParams, excludeUserId: number, excludeGender: number): Promise<PostRow[]> {
        const {
            ageFrom,
            ageTo,
            dateFrom,
            dateTo,
            keywords,
            isImmediate,
        } = params;

        const conditions: string[] = ["p.status = 'active'"];
        const values: any[] = [];

        // 除外条件（自分と同性）
        conditions.push("p.user_id != ?");
        values.push(excludeUserId);

        conditions.push("u.gender != ?");
        values.push(excludeGender);

        // 日付・即時
        if (isImmediate) {
            conditions.push("p.is_immediate = 1");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            conditions.push("p.date >= ?");
            values.push(today);
        } else {
            if (dateFrom) {
                conditions.push("p.date >= ?");
                values.push(dateFrom);
            }
            if (dateTo) {
                conditions.push("p.date <= ?");
                values.push(dateTo);
            }
        }

        // 年齢条件
        if (ageFrom !== undefined) {
            conditions.push("u.age >= ?");
            values.push(ageFrom);
        }
        if (ageTo !== undefined) {
            conditions.push("u.age <= ?");
            values.push(ageTo);
        }


        // AND 条件でのキーワード検索
        if (keywords && keywords.length > 0) {
            keywords.forEach(() => {
                conditions.push("p.message LIKE ?");
            });
            keywords.forEach((kw) => {
                values.push(`%${kw}%`);
            });
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const [rows] = await db.query(
            `
            SELECT
                p.id AS post_id,
                p.user_id,
                p.message,
                p.created_at,
                u.display_name,
                u.age,
                u.x_username,
                u.insta_username,
                i.image_url,
                i.order AS image_order
            FROM posts p
            JOIN user_profile u ON p.user_id = u.user_id
            LEFT JOIN post_images i ON p.id = i.post_id
            ${whereClause}
            ORDER BY p.created_at DESC, i.order ASC
            LIMIT 50
            `,
            values
        );

        return rows as PostRow[];
    }
}