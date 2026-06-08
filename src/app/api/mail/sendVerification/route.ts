import { NextResponse } from "next/server";
import { loadTemplate } from "@/emails/templates/loadTemplate";

export async function POST(req: Request) {
    try {
        const { email, verifyUrl } = await req.json();

        if (!email || !verifyUrl) {
            return NextResponse.json(
                { error: "missing params" },
                { status: 400 }
            );
        }

        // ① テンプレ生成
        const html = loadTemplate("verification", {
            url: verifyUrl,
        });

        // ② メール送信
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Goukon App <onboarding@resend.dev>",
                to: email,
                subject: "メールアドレスの確認",
                html,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(err);

            return NextResponse.json(
                { error: "email send failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "internal error" },
            { status: 500 }
        );
    }
}