// src/services/VerifyEmailService.ts

import db from "@/lib/db";
import { EmailVerificationRepository } from "@/repositories/EmailVerificationRepository";
import { UserRepository } from "@/repositories/UserRepository";

export type VerifyStatus =
    | "success"
    | "already_verified"
    | "expired"
    | "invalid";

export class VerifyEmailService {static async verify(token?: string): Promise<VerifyStatus> {
        if (!token) {
            return "invalid";
        }

        const verification = await EmailVerificationRepository.findByToken(token);
        if (!verification) {
            return "invalid";
        }

        // 既に認証済み
        if (verification.used === 1) {
            return "already_verified";
        }

        // 有効期限切れ
        if (new Date(verification.expires_at).getTime() < Date.now()) {
            return "expired";
        }

        const conn = await db.getConnection();

        try {
            await conn.beginTransaction();

            // user_info.is_email_verified = 1
            await UserRepository.verifyEmail(
                conn,
                verification.user_id
            );

            // email_verifications.used = 1
            await EmailVerificationRepository.markAsUsed(
                conn,
                verification.token
            );

            await conn.commit();

            return "success";
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
}