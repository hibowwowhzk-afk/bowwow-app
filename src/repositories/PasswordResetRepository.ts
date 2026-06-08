// src/repositories/PasswordResetRepository.ts

import { PoolConnection } from "mysql2/promise";

export type PasswordResetRow = {
    user_id: number;
    uid: string;
    token: string;
    expires_at: Date;
    last_sent_at: Date;
};

export type PasswordResetWithUser = {
    id: number;
    token: string;
    expires_at: Date;
    used_at: Date | null;
    last_sent_at: Date;
    created_at: Date;

    user_id: number;
    u_id: string;
    email: string;
};

export class PasswordResetRepository {

    static async invalidateByUserId(
        conn: PoolConnection,
        userId: number,
        token: string
    ) {
        await conn.query(
            `
            UPDATE password_resets
            SET used_at = NOW()
            WHERE user_id = ?
              AND token = ?
              AND used_at IS NULL
            `,
            [userId, token]
        );
    }

    static async create(
        conn: PoolConnection,
        data: PasswordResetRow
    ) {
        await conn.query(
            `
            INSERT INTO password_resets
            (user_id, token, expires_at, last_sent_at, created_at)
            VALUES (?, ?, ?, ?, NOW())
            `,
            [
                data.user_id,
                data.token,
                data.expires_at,
                data.last_sent_at
            ]
        );
    }

    static async findByToken(
        conn: PoolConnection,
        token: string
    ): Promise<PasswordResetWithUser | null> {

        const [rows]: any = await conn.query(
            `
            SELECT
                pr.id,
                pr.token,
                pr.expires_at,
                pr.used_at,
                pr.last_sent_at,
                pr.created_at,

                ui.user_id,
                ui.u_id,
                ui.email

            FROM password_resets pr
            INNER JOIN user_info ui
                ON pr.user_id = ui.user_id

            WHERE pr.token = ?
            LIMIT 1
            `,
            [token]
        );

        return rows[0] ?? null;
    }
}