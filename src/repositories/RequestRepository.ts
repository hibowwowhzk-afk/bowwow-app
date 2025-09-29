// src/repositories/RequestRepository.ts
import db from "@/lib/db";

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

static async getMatchedRequestsByUserId(userId: number) {
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
            JOIN user_profile u ON
                -- 相手のプロフィールを表示するための結合条件
                CASE
                    WHEN r.to_user_id = ? THEN r.from_user_id
                    ELSE r.to_user_id
                END = u.user_id
            LEFT JOIN user_profile_image pi ON u.user_id = pi.user_id AND pi.order = 1
            WHERE (r.to_user_id = ? OR r.from_user_id = ?)
                AND p.status = 'active'
                AND r.status = 'accepted'
            ORDER BY r.created_at DESC
        `, [userId, userId, userId]);

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
}