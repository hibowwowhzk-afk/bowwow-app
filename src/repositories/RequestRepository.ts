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
}