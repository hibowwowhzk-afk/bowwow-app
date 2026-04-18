// src/repositories/RequestRepository.ts
import db from "@/lib/db";
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

export class RequestRepository {
    static async insertRequest(data: {
        from_user_id: number;
        to_user_id: number;
        post_id: number;
        message: string;
    }) {
        const sql = `
        INSERT INTO requests (from_user_id, to_user_id, post_id, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
        `;
        const [result] = await db.query(sql, [
        data.from_user_id,
        data.to_user_id,
        data.post_id,
        data.message,
        ]);

        return result;
    }

    static async getRequestsByUserId(userId: number) {
        try {
            const [rows] = await db.execute(`
                SELECT
                    r.id AS request_id,
                    r.message AS request_message,
                    r.created_at AS request_created_at,

                    u.display_name AS user_display_name,
                    pi.image_url AS user_profile_image

                FROM requests r
                JOIN posts p ON r.post_id = p.id
                JOIN user_profile u ON r.from_user_id = u.user_id
                LEFT JOIN user_profile_image pi ON r.from_user_id = pi.user_id AND pi.order = 1
                WHERE r.to_user_id = ?
                AND p.status = 'active'
                AND r.status = 'pending'
                ORDER BY r.created_at DESC
            `, [userId]);

            if (Array.isArray(rows) && rows.length === 0) {
                throw new Error('No active requests found for this user.');
            }

            return rows;
        } catch (error) {
            console.error('Error fetching requests:', error);
            throw new Error('データの取得に失敗しました');
        }
    }

    // 未読の「受信したリクエスト」（pending状態で、lastCheckedより後のcreated_at）
    static async getUnreadIncomingRequests(userId: number, lastChecked: Date) {
        try {
            const [rows] = await db.execute(`
                SELECT
                    r.id AS request_id,
                    r.message AS request_message,
                    r.created_at AS request_created_at,
                    u.display_name AS user_display_name,
                    pi.image_url AS user_profile_image
                FROM requests r
                JOIN posts p ON r.post_id = p.id
                JOIN user_profile u ON r.from_user_id = u.user_id
                LEFT JOIN user_profile_image pi ON r.from_user_id = pi.user_id AND pi.order = 1
                WHERE r.to_user_id = ?
                    AND p.status = 'active'
                    AND r.status = 'pending'
                    AND r.created_at > ?
                ORDER BY r.created_at DESC
            `, [userId, lastChecked]);

            return rows;
        } catch (error) {
            console.error('Error fetching unread incoming requests:', error);
            throw new Error('データの取得に失敗しました');
        }
    }

    // 未読の「承諾されたリクエスト」（accepted状態で、lastCheckedより後のupdated_at）
    static async getUnreadAcceptedRequests(userId: number, lastChecked: Date) {
        try {
            const [rows] = await db.execute(`
                SELECT
                    r.id AS request_id,
                    r.message AS request_message,
                    r.updated_at AS request_updated_at,
                    u.display_name AS user_display_name,
                    pi.image_url AS user_profile_image
                FROM requests r
                JOIN posts p ON r.post_id = p.id
                JOIN user_profile u ON r.to_user_id = u.user_id
                LEFT JOIN user_profile_image pi ON u.user_id = pi.user_id AND pi.order = 1
                WHERE r.from_user_id = ?
                    AND p.status = 'active'
                    AND r.status = 'accepted'
                    AND r.updated_at > ?
                ORDER BY r.updated_at DESC
            `, [userId, lastChecked]);

            return rows;
        } catch (error) {
            console.error('Error fetching unread accepted requests:', error);
            throw new Error('データの取得に失敗しました');
        }
    }

    static async getRequestById(requestId: number): Promise<any> {
        const sql = `SELECT * FROM requests WHERE id = ?`;
        const [rows] = await db.execute(sql, [requestId]);
        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0];
        }
        throw new Error('リクエストが見つかりません');
    }

    static async updateRequestStatus(requestId: number, status: 'accepted' | 'rejected') {
        const sql = `
            UPDATE requests
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [status, requestId]);
        return result;
    }

    // 自分から送ったリクエスト
    static async getRequestsFromMe(userId: number) {
        try {
            const [rows] = await db.execute(`
                SELECT
                    p.date AS post_date,
                    r.id AS request_id,
                    r.message AS request_message,
                    r.created_at AS request_created_at,
                    u.display_name AS user_display_name,
                    pi.image_url AS user_profile_image,
                    r.from_user_id,
                    r.to_user_id
                FROM requests r
                JOIN posts p ON r.post_id = p.id
                JOIN user_profile u ON r.to_user_id = u.user_id
                LEFT JOIN user_profile_image pi ON r.to_user_id = pi.user_id AND pi.order = 1
                WHERE r.from_user_id = ?
                    AND p.status = 'active'
                    AND r.status = 'pending'
                ORDER BY r.created_at DESC
            `, [userId]);

            return rows;
        } catch (error) {
            console.error('Error fetching requests from me:', error);
            throw new Error('自分からのリクエストの取得に失敗しました');
        }
    }

    // 自分が受け取ったリクエスト
    static async getRequestsFromOthers(userId: number) {
        try {
            const [rows] = await db.execute(`
                SELECT
                    p.date AS post_date,
                    r.id AS request_id,
                    r.message AS request_message,
                    r.created_at AS request_created_at,
                    u.display_name AS user_display_name,
                    pi.image_url AS user_profile_image,
                    r.from_user_id,
                    r.to_user_id
                FROM requests r
                JOIN posts p ON r.post_id = p.id
                JOIN user_profile u ON r.from_user_id = u.user_id
                LEFT JOIN user_profile_image pi ON r.from_user_id = pi.user_id AND pi.order = 1
                WHERE r.to_user_id = ?
                    AND p.status = 'active'
                    AND r.status = 'pending'
                ORDER BY r.created_at DESC
            `, [userId]);

            return rows;
        } catch (error) {
            console.error('Error fetching requests from others:', error);
            throw new Error('相手からのリクエストの取得に失敗しました');
        }
    }

    static async getRequestDetailById(requestId: number): Promise<{
        request_message: string;
        from_user_id: number;
        request_created_at: string;
        post_id: number;
    } | null> {
        const sql = `
            SELECT
                r.message AS request_message,
                r.from_user_id,
                r.created_at AS request_created_at,
                r.post_id
            FROM requests r
            WHERE r.id = ?
            LIMIT 1
        `;

        const [rows] = await db.execute<RowDataPacket[]>(sql, [requestId]);
        if (rows.length === 0) return null;

        const row = rows[0];

        return {
            request_message: String(row.request_message),
            from_user_id: Number(row.from_user_id),
            request_created_at: String(row.request_created_at),
            post_id: Number(row.post_id),
        };
    }

    /**
     * 指定された post に紐づくリクエストをキャンセル状態にする
     * トランザクション前提（conn 必須）
     */
    static async cancelByPost(
        conn: PoolConnection,
        postId: number
    ): Promise<number> {
        const [result] = await conn.execute<ResultSetHeader>(
            `
            UPDATE requests
            SET status = 'canceled',
                updated_at = NOW()
            WHERE post_id = ?
              AND status IN ('pending', 'accepted')
            `,
            [postId]
        );

        return result.affectedRows;
    }
}