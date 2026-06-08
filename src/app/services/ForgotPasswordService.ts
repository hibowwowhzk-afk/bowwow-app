// src/app/services/ForgotPasswordService.ts

import db from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { PasswordResetRepository } from "@/repositories/PasswordResetRepository";
import { PasswordResetEmailSender } from "@/app/services/PasswordResetEmailSender";
import { randomUUID } from "crypto";

export class ForgotPasswordService {
    async sendResetMail(email: string) {
        const conn = await db.getConnection();

        try {
            const cleanEmail = email.trim().toLowerCase();

            const user = await UserRepository.findByEmail(conn, cleanEmail);

            // 存在しない or 未認証は成功扱い（情報漏洩防止）
            if (!user || user.is_email_verified !== 1) {
                console.log("aa")
                return { ok: true };
            }

            // トークン生成
            const token = randomUUID();

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 30);

            // 既存未使用トークンを無効化
            await PasswordResetRepository.invalidateByUserId(conn, user.user_id);

            // DB登録
            await PasswordResetRepository.create(conn, {
                user_id: user.user_id,
                token,
                expires_at: expiresAt,
                last_sent_at: new Date(),
            });

            // メール送信
            await PasswordResetEmailSender.sendPasswordReset({
                email: cleanEmail,
                token,
            });

            return { ok: true };

        } finally {
            conn.release();
        }
    }
}