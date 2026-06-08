// src/app/api/auth/resendVerification/route.ts

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import { EmailVerificationRepository } from "@/repositories/EmailVerificationRepository";
import { AuthEmailSender } from "@/app/services/AuthEmailSender";

export async function POST(req: Request) {
    const conn = await db.getConnection();

    await conn.beginTransaction();

    try {
        const { email } = await req.json();

        const cleanEmail = email.trim().toLowerCase();

        // ① ユーザー取得
        const user = await UserRepository.findByEmail(conn, cleanEmail);

        if (!user) {
            const err: any = new Error("このメールアドレスは登録されていません");
            err.status = 404;
            throw err;
        }

        // ② すでに認証済み
        if (user.is_email_verified) {
            const err: any = new Error("すでに認証済みです");
            err.status = 409;
            throw err;
        }

        const last = await EmailVerificationRepository.findLatestByUid(conn, user.uid);

        const cooldownMs = 60 * 1000; // 60秒

        if (last?.last_sent_at) {
            const diff = Date.now() - new Date(last.last_sent_at).getTime();

            if (diff < cooldownMs) {
                const err: any = new Error(
                    "少し時間をおいてから再送してください"
                );
                err.status = 429;
                throw err;
            }
        }

        // ③ メール再送（共通ロジック）
        await AuthEmailSender.sendVerification({
            conn,
            uid: user.u_id,
            email: cleanEmail,
        });

        await conn.commit();

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        await conn.rollback();

        console.error(err);

        if (err?.status) {
            return NextResponse.json(
                { error: err.message },
                { status: err.status }
            );
        }

        return NextResponse.json(
            { error: "internal error" },
            { status: 500 }
        );

    } finally {
        conn.release();
    }
}