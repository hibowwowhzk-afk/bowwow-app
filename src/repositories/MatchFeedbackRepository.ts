// src/repositories/MatchFeedbackRepository.ts
import db from "@/lib/db";

export class MatchFeedbackRepository {
    /**
     * 新規作成
     */
    static async insert(matchId: number, userId: number, result: 'met' | 'not_met') {
        await db.execute(
            `
            INSERT INTO match_feedbacks
            (match_id, user_id, result, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
            `,
            [matchId, userId, result]
        );
    }
}