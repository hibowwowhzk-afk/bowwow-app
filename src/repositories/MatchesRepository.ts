// src/repositories/MatchesRepository.ts
import db from "@/lib/db";
import { RowDataPacket } from 'mysql2';

export type MatchedUser = {
    match_id: number;
    matched_at: string; // ISO日時文字列
    match_message: string | null;
    user_display_name: string;
    user_profile_image: string | null;
    self_user_id: number;  // 自分のユーザーID
    from_user_id: number;
    to_user_id: number;
};

export class MatchesRepository {
    /**
     * 自分が送ったマッチング（fromMe）
     */
    static async getMatchingsFromMe(userId: number): Promise<MatchedUser[]> {
        const [rows] = await db.execute<RowDataPacket[]>(`
            SELECT
                p.date AS post_date, 
                m.id AS match_id,
                m.matched_at,
                m.match_message,
                u.user_id,
                u.display_name AS user_display_name,
                pi.image_url AS user_profile_image,
                m.from_user_id,
                m.to_user_id
            FROM matches m
            JOIN requests r ON m.request_id = r.id
            JOIN posts p ON m.post_id = p.id
            JOIN user_profile u ON m.to_user_id = u.user_id
            LEFT JOIN user_profile_image pi ON u.user_id = pi.user_id AND pi.order = 1
            WHERE m.from_user_id = ?
              AND p.status = 'active'
            ORDER BY m.matched_at DESC
        `, [userId]);
    
        return (rows as any[]).map(row => ({
            post_date: row.post_date,
            match_id: row.match_id,
            matched_at: row.matched_at,
            match_message: row.match_message,
            user_display_name: row.user_display_name,
            user_profile_image: row.user_profile_image,
            self_user_id: userId,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
        }));
    }
    /**
     * 相手からのマッチング（fromOthers）
     */
    static async getMatchingsFromOthers(userId: number): Promise<MatchedUser[]> {
        const [rows] = await db.execute<RowDataPacket[]>(`
            SELECT
                p.date AS post_date,               
                m.id AS match_id,
                m.matched_at,
                m.match_message,
                u.user_id,
                u.display_name AS user_display_name,
                pi.image_url AS user_profile_image,
                m.from_user_id,
                m.to_user_id
            FROM matches m
            JOIN requests r ON m.request_id = r.id
            JOIN posts p ON m.post_id = p.id
            JOIN user_profile u ON m.from_user_id = u.user_id
            LEFT JOIN user_profile_image pi ON u.user_id = pi.user_id AND pi.order = 1
            WHERE m.to_user_id = ?
              AND p.status = 'active'
            ORDER BY m.matched_at DESC
        `, [userId]);
    
        return (rows as any[]).map(row => ({
            post_date: row.post_date,
            match_id: row.match_id,
            matched_at: row.matched_at,
            match_message: row.match_message,
            user_display_name: row.user_display_name,
            user_profile_image: row.user_profile_image,
            self_user_id: userId,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
        }));
    }

    /**
     * マッチ登録
     */
    static async insertMatch(data: {
        request_id: number;
        post_id: number;
        from_user_id: number;
        to_user_id: number;
        match_message: string | null;
    }): Promise<void> {
        const sql = `
            INSERT INTO matches (
                request_id,
                post_id,
                from_user_id,
                to_user_id,
                match_message,
                matched_at,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        `;
        await db.execute(sql, [
            data.request_id,
            data.post_id,
            data.from_user_id,
            data.to_user_id,
            data.match_message,
        ]);
    }

    static async findMatchIdAndToUser(matchId: number): Promise<{ match_id: number; to_user_id: number } | null> {
        const [rows] = await db.execute<RowDataPacket[]>(
            `SELECT id AS match_id, to_user_id FROM matches WHERE id = ? LIMIT 1`,
            [matchId]
        );
    
        if (!rows || rows.length === 0) return null;
    
        const row = rows[0];
        return {
            match_id: Number(row.match_id),
            to_user_id: Number(row.to_user_id),
        };
    }

    static async getMatchDetail(matchId: number): Promise<{
        match_id: number;
        request_id: number;
        post_id: number;
        match_message: string | null;
        from_user_id: number;
        to_user_id: number;
        created_at: string;
        matched_at: string;
    } | null> {
        const [rows] = await db.execute<RowDataPacket[]>(`
            SELECT
                id AS match_id,
                request_id,
                post_id,
                match_message,
                from_user_id,
                to_user_id,
                created_at,
                matched_at
            FROM matches
            WHERE id = ?
            LIMIT 1
        `, [matchId]);
    
        if (!rows || rows.length === 0) return null;
    
        const row = rows[0];
    
        return {
            match_id: Number(row.match_id),
            request_id: Number(row.request_id),
            post_id: Number(row.post_id),
            match_message: row.match_message,
            from_user_id: Number(row.from_user_id),
            to_user_id: Number(row.to_user_id),
            created_at: row.created_at,
            matched_at: row.matched_at,
        };
    }
}