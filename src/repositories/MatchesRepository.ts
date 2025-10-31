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
    static async getMatchedUsersByUserId(userId: number): Promise<MatchedUser[]> {
        const [rows] = await db.execute<RowDataPacket[]>(`
          SELECT
            m.id AS match_id,
            m.matched_at,
            m.match_message,
            u.user_id,
            u.display_name AS user_display_name,
            pi.image_url AS user_profile_image,
            m.from_user_id,
            m.to_user_id
          FROM matches m
          JOIN user_profile u ON
            CASE WHEN m.from_user_id = ? THEN m.to_user_id ELSE m.from_user_id END = u.user_id
          LEFT JOIN user_profile_image pi ON u.user_id = pi.user_id AND pi.order = 1
          WHERE m.from_user_id = ? OR m.to_user_id = ?
          ORDER BY m.matched_at DESC
        `, [userId, userId, userId]);
      
        return (rows as any[]).map(row => ({
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

    // 👇 追加：マッチ登録処理
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
}