// src/app/api/auth/forgotPassword/route.ts

import { NextResponse } from "next/server";
import { ForgotPasswordService } from "@/app/services/ForgotPasswordService";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        const service = new ForgotPasswordService();

        await service.sendResetMail(email);

        return NextResponse.json({
            ok: true,
        });

    } catch (err: any) {
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
    }
}