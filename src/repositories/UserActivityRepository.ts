// src/repositories/UserActivityRepository.ts
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

type UserActivity = {
    user_id: number;
    last_opened_at: Date | null;
    last_login_at: Date | null;
    last_checked_requests_at: Date | null;
    last_checked_accepted_at: Date | null;
    last_dm_checked_at: Date | null;   
    created_at: Date;
    updated_at: Date;
};

export class UserActivityRepository {

    /**
     * ユーザーのアクティビティ情報を取得
     */
    static async findByUserId(userId: number): Promise<UserActivity | null> {
        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM user_activity WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0] as UserActivity;
        }
        return null;
    }

    /**
     * 通知確認日時を現在の時間に更新（通知既読処理）
     */
    static async markAsRead(userId: number, type: 'requests' | 'accepted' | 'dm'): Promise<void> {
        let field = '';
        if (type === 'requests') {
            field = 'last_checked_requests_at';
        } else if (type === 'accepted') {
            field = 'last_checked_accepted_at';
        } else if (type === 'dm') {
            field = 'last_dm_checked_at';
        } else {
            throw new Error(`Invalid notification type: ${type}`);
        }

        await db.execute(
            `UPDATE user_activity SET ${field} = NOW() WHERE user_id = ?`,
            [userId]
        );
    }

    /**
     * アクティビティを作成する（初回登録など）
     */
    static async createUser(conn: any, userId: number): Promise<void> {
        await conn.execute(
            `
            INSERT INTO user_activity (user_id)
            SELECT ? FROM DUAL
            WHERE NOT EXISTS (
                SELECT 1 FROM user_activity WHERE user_id = ?
            )
            `,
            [userId, userId]
        );
    }
}