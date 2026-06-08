import db from "@/lib/db";
import { PoolConnection } from "mysql2/promise";

export type EmailVerification = {
    id?: number;
    uid: string;
    token: string;
    expires_at: Date;
    used?: number;
    created_at?: Date;
    last_sent_at?: Date;
};

export class EmailVerificationRepository {

    /**
     * 最新の認証メール取得（再送制御用）
     */
    static async findLatestByUid(
        conn: PoolConnection,
        uid: string
    ): Promise<EmailVerification | null> {

        const [rows] = await conn.query(
            `
            SELECT *
            FROM email_verifications
            WHERE u_id = ?
            ORDER BY id DESC
            LIMIT 1
            `,
            [uid]
        );

        return (rows as EmailVerification[])[0] ?? null;
    }

    /**
     * 認証トークンを保存
     */
    static async createVerification(
        conn: PoolConnection,
        data: EmailVerification
    ): Promise<void> {

        await conn.execute(
            `
            INSERT INTO email_verifications
            (
                u_id,
                token,
                expires_at,
                used,
                created_at,
                last_sent_at
            )
            VALUES (?, ?, ?, 0, NOW(), NOW())
            `,
            [
                data.uid,
                data.token,
                data.expires_at,
            ]
        );
    }

    /**
     * トークンから取得（未使用 & 有効期限内）
     */
    static async findByToken(token: string) {
        const [rows]: any = await db.query(
            `
            SELECT *
            FROM email_verifications
            WHERE token = ?
              AND used = 0
            LIMIT 1
            `,
            [token]
        );

        return rows[0] ?? null;
    }

    /**
     * トークン使用済みにする
     */
    static async markAsUsed(conn: PoolConnection, token: string) {
        await conn.query(
            `
            UPDATE email_verifications
            SET used = 1
            WHERE token = ?
            `,
            [token]
        );
    }

    /**
     * ユーザーの古いトークン削除（再送前クリア用）
     */
    static async deleteByUid(conn: PoolConnection, uId: string) {
        await conn.query(
            `
            DELETE FROM email_verifications
            WHERE u_id = ?
            `,
            [uId]
        );
    }
}