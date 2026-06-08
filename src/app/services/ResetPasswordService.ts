import db from "@/lib/db";
import { PasswordResetRepository } from "@/repositories/PasswordResetRepository";
import { getAuth } from "firebase-admin/auth";

export class ResetPasswordService {
    async resetPassword(token: string, newPassword: string) {
        const conn = await db.getConnection();

        try {
            const reset = await PasswordResetRepository.findByToken(conn, token);

            if (!reset) {
                const err: any = new Error("無効なトークンです");
                err.status = 400;
                throw err;
            }

            if (reset.used_at) {
                const err: any = new Error("このリンクは使用済みです");
                err.status = 400;
                throw err;
            }

            if (new Date(reset.expires_at).getTime() < Date.now()) {
                const err: any = new Error("リンクの有効期限が切れています");
                err.status = 400;
                throw err;
            }

            // ★ここが修正ポイント
            await getAuth().updateUser(reset.u_id, {
                password: newPassword,
            });

            await PasswordResetRepository.invalidateByUserId(conn, reset.user_id, token);

            return { ok: true };

        } finally {
            conn.release();
        }
    }
}