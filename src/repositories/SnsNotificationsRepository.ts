// src/repositories/SnsNotificationsRepository.ts
import db from '@/lib/db';

/**
 * SNS通知リポジトリ
 */
export class SnsNotificationsRepository {
    /**
     * 通知を作成
     */
    static async create(data: {
        match_id: number;
        from_user_id: number;
        to_user_id: number;
        message?: string; // デフォルト値はDB側で設定される
    }): Promise<void> {
        const sql = `
            INSERT INTO sns_notifications (
                match_id,
                from_user_id,
                to_user_id,
                message,
                sent_at
            ) VALUES (?, ?, ?, ?, NOW())
        `;
        await db.execute(sql, [
            data.match_id,
            data.from_user_id,
            data.to_user_id,
            data.message ?? 'DM送信しました。よろしくお願いします。',
        ]);
    }

    /**
     * 未読DM通知を取得（オプションでlastChecked以降）
     */
    static async getUnreadByToUserId(toUserId: number, lastChecked?: Date) {
        const params: any[] = [toUserId];

        let sql = `
            SELECT match_id
            FROM sns_notifications
            WHERE to_user_id = ?
        `;

        if (lastChecked) {
            sql += ' AND sent_at > ?';
            params.push(lastChecked);
        }

        sql += ' ORDER BY sent_at DESC';

        const [rows] = await db.execute(sql, params);
        return rows as { match_id: number }[];
    }

    static async getByMatchId(matchId: number): Promise<{
        match_id: number;
        from_user_id: number;
        to_user_id: number;
        message: string;
        sent_at: string;
    } | null> {
        const sql = `
            SELECT
                match_id,
                from_user_id,
                to_user_id,
                message,
                sent_at
            FROM sns_notifications
            WHERE match_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
        `;
    
        const [rows] = await db.execute(sql, [matchId]);
    
        // rows を any[] として扱う
        const list = rows as any[];
    
        if (list.length === 0) return null;
    
        const row = list[0];
    
        return {
            match_id: row.match_id,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
            message: row.message,
            sent_at: row.sent_at,
        };
    }

    static async findByMatchId(matchId: number) {
        const sql = `
            SELECT id
            FROM sns_notifications
            WHERE match_id = ?
            LIMIT 1
        `;

        const [rows]: any = await db.execute(sql, [matchId]);
        return rows[0] || null;
    }
}