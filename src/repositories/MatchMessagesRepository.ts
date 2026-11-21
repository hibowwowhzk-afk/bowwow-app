
import db from "@/lib/db";
import {
    ResultSetHeader,
    RowDataPacket,
    PoolConnection,
} from "mysql2/promise";

export type MatchMessage = {
    id: number;
    match_id: number;
    sender_user_id: number;
    message: string;
    created_at: Date;
};

export type LatestMatchMessage = {
    match_id: number;
    last_message: string;
    last_message_at: Date;
};

export type InsertMatchMessageParams = {
    match_id: number;
    sender_user_id: number;
    message: string;
};

type MatchMessageRow = MatchMessage & RowDataPacket;

type LatestMatchMessageRow = LatestMatchMessage & RowDataPacket;

type CountRow = RowDataPacket & {
    total_count: number;
};

export class MatchMessagesRepository {
    /**
     * マッチングのメッセージ一覧を取得
     */
    static async getByMatchId(
        matchId: number
    ): Promise<MatchMessage[]> {
        const [rows] = await db.execute<MatchMessageRow[]>(
            `
            SELECT
                id,
                match_id,
                sender_user_id,
                message,
                created_at
            FROM match_messages
            WHERE match_id = ?
            ORDER BY created_at ASC, id ASC
            `,
            [matchId]
        );

        return rows;
    }

    /**
     * 複数マッチングの最新メッセージを一括取得
     */
    static async getLatestMessagesByMatchIds(
        matchIds: number[]
    ): Promise<LatestMatchMessage[]> {
        if (matchIds.length === 0) {
            return [];
        }

        const placeholders = matchIds.map(() => "?").join(", ");

        const [rows] = await db.execute<LatestMatchMessageRow[]>(
            `
            SELECT
                mm.match_id,
                mm.message AS last_message,
                mm.created_at AS last_message_at
            FROM match_messages mm
            WHERE mm.match_id IN (${placeholders})
            AND NOT EXISTS (
                SELECT 1
                FROM match_messages newer
                WHERE newer.match_id = mm.match_id
                AND (
                    newer.created_at > mm.created_at
                    OR (
                        newer.created_at = mm.created_at
                        AND newer.id > mm.id
                    )
                )
            )
            `,
            matchIds
        );

        return rows;
    }

    /**
     * メッセージを登録
     */
    static async insert(
        params: InsertMatchMessageParams
    ): Promise<number> {
        const [result] = await db.execute<ResultSetHeader>(
            `
            INSERT INTO match_messages (
                match_id,
                sender_user_id,
                message,
                created_at
            ) VALUES (?, ?, ?, NOW())
            `,
            [
                params.match_id,
                params.sender_user_id,
                params.message,
            ]
        );

        return result.insertId;
    }

    /**
     * メッセージ総数を取得
     * リクエスト + 承認 + 通常メッセージ
     */
    static async getTotalCount(
        matchId: number,
        connection?: PoolConnection
    ): Promise<number> {
        const executor = connection ?? db;

        const [rows] = await executor.execute<CountRow[]>(
            `
            SELECT
                (
                    CASE
                        WHEN r.message IS NOT NULL
                            AND TRIM(r.message) <> ''
                        THEN 1 ELSE 0
                    END
                    +
                    CASE
                        WHEN m.match_message IS NOT NULL
                            AND TRIM(m.match_message) <> ''
                        THEN 1 ELSE 0
                    END
                    +
                    (
                        SELECT COUNT(*)
                        FROM match_messages mm
                        WHERE mm.match_id = m.id
                    )
                ) AS total_count
            FROM matches m
            LEFT JOIN requests r
                ON r.id = m.request_id
            WHERE m.id = ?
            `,
            [matchId]
        );

        return Number(rows[0]?.total_count ?? 0);
    }

    /**
     * トランザクション内でメッセージを登録
     */
    static async insertWithLimit(
        params: InsertMatchMessageParams
    ): Promise<{
        message: MatchMessage;
        total_count: number;
        remaining_count: number;
    }> {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // マッチング行をロック
            const [matchRows] = await connection.execute<RowDataPacket[]>(
                `
                SELECT id
                FROM matches
                WHERE id = ?
                FOR UPDATE
                `,
                [params.match_id]
            );

            if (matchRows.length === 0) {
                throw new Error("MATCH_NOT_FOUND");
            }

            // メッセージ総数確認
            const totalCount = await this.getTotalCount(
                params.match_id,
                connection
            );

            if (totalCount >= 20) {
                throw new Error("MESSAGE_LIMIT_REACHED");
            }

            // 登録
            const [result] =
                await connection.execute<ResultSetHeader>(
                    `
                    INSERT INTO match_messages (
                        match_id,
                        sender_user_id,
                        message,
                        created_at
                    ) VALUES (?, ?, ?, NOW())
                    `,
                    [
                        params.match_id,
                        params.sender_user_id,
                        params.message,
                    ]
                );

            // 登録したメッセージ取得
            const [rows] =
                await connection.execute<MatchMessageRow[]>(
                    `
                    SELECT
                        id,
                        match_id,
                        sender_user_id,
                        message,
                        created_at
                    FROM match_messages
                    WHERE id = ?
                    `,
                    [result.insertId]
                );

            await connection.commit();

            return {
                message: rows[0],
                total_count: totalCount + 1,
                remaining_count: Math.max(0, 19 - totalCount),
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    }

    /**
     * 相手から届いた未読メッセージを既読に更新
     */
    static async markAsRead(
        matchId: number,
        userId: number
    ): Promise<void> {
        await db.execute(
            `
            UPDATE match_messages
            SET
                is_read = 1,
                read_at = NOW()
            WHERE
                match_id = ?
                AND sender_user_id <> ?
                AND is_read = 0
            `,
            [matchId, userId]
        );
    }

    static async getUnreadCountsByMatchIds(
        matchIds: number[],
        userId: number
    ): Promise<{ match_id: number; unread_count: number }[]> {
        if (matchIds.length === 0) {
            return [];
        }
    
        const placeholders = matchIds.map(() => '?').join(', ');
    
        const [rows] = await db.execute<RowDataPacket[]>(
            `
            SELECT
                match_id,
                COUNT(*) AS unread_count
            FROM match_messages
            WHERE
                match_id IN (${placeholders})
                AND sender_user_id <> ?
                AND is_read = 0
            GROUP BY match_id
            `,
            [...matchIds, userId]
        );
    
        return rows.map((row) => ({
            match_id: Number(row.match_id),
            unread_count: Number(row.unread_count),
        }));
    }
}
