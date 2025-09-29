// src/repositories/UserActivityRepository.ts
import db from "@/lib/db";
import { RowDataPacket } from "mysql2";

type UserActivity = {
    user_id: number;
    last_opened_at: Date | null;
    last_login_at: Date | null;
    last_checked_requests_at: Date | null;
    last_checked_accepted_at: Date | null;
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
    static async updateNotificationCheckedAt(userId: number, date: Date) {
        await db.query(
            `
            UPDATE user_activity
            SET last_notification_checked_at = ?, updated_at = NOW()
            WHERE user_id = ?
            `,
            [date, userId]
        );
    }

    /**
     * アクティビティが存在しない場合に作成する（初回ログインなどで）
     */
    static async createIfNotExists(userId: number) {
        await db.query(
            `
            INSERT INTO user_activity (user_id)
            SELECT * FROM (SELECT ? AS user_id) AS tmp
            WHERE NOT EXISTS (
                SELECT 1 FROM user_activity WHERE user_id = ?
            ) LIMIT 1
            `,
            [userId, userId]
        );
    }
}