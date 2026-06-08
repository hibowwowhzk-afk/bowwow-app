// src/repositories/ReportRepository.ts
import db from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type ReportTargetType = "match" | "history";

export type InsertReportParams = {
    reporter_id: number;
    target_user_id: number;
    target_type: ReportTargetType;
    target_id: number;
    reason: string;
    comment?: string | null;
};

export class ReportRepository {
    /**
     * 通報を登録
     */
    static async insert(params: InsertReportParams): Promise<number> {
        const [result] = await db.execute<ResultSetHeader>(
            `
            INSERT INTO reports (
                reporter_id,
                target_user_id,
                target_type,
                target_id,
                reason,
                comment,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
            `,
            [
                params.reporter_id,
                params.target_user_id,
                params.target_type,
                params.target_id,
                params.reason,
                params.comment ?? null,
            ]
        );

        return result.insertId;
    }
}