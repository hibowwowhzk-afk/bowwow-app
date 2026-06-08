// src/app/api/auth/resetPassword/route.ts

import { NextResponse } from "next/server";
import { ResetPasswordService } from "@/app/services/ResetPasswordService";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        const service = new ResetPasswordService();

        await service.resetPassword(token, password);

        return NextResponse.json({ ok: true });

    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "error" },
            { status: err.status || 500 }
        );
    }
}