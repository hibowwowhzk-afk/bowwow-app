import crypto from "crypto";
import { loadTemplate } from "@/emails/templates/loadTemplate";
import { EmailVerificationRepository } from "@/repositories/EmailVerificationRepository";

export class AuthEmailSender {

    static async sendVerification({
        conn,
        uid,
        email,
    }: {
        conn: any;
        uid: string;
        email: string;
    }) {

        const token = crypto.randomUUID();

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // ① DB保存（ここだけでOK）
        await EmailVerificationRepository.createVerification(conn, {
            uid: uid,
            token,
            expires_at: expiresAt,
        });

        // ② メール送信
        const verifyUrl =
            `http://localhost:3000/verify-email?token=${token}`;

        const html = loadTemplate("verification", {
            url: verifyUrl,
        });

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "App <onboarding@resend.dev>",
                to: email,
                subject: "メールアドレスの確認",
                html,
            }),
        });

        return { token };
    }
}