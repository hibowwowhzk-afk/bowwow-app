import { loadTemplate } from "@/emails/templates/loadTemplate";

export class PasswordResetEmailSender {

    static async sendPasswordReset({
        email,
        token,
    }: {
        email: string;
        token: string;
    }) {

        const resetUrl =
            `http://localhost:3000/reset-password?token=${token}`;

        const html = loadTemplate("password-reset", {
            url: resetUrl,
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
                subject: "パスワード再設定",
                html,
            }),
        });

        return { token };
    }
}