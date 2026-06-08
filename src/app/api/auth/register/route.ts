// src/app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import { RegisterService } from "@/app/services/RegisterService";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const service = new RegisterService();

        const result = await service.register(email, password);

        return NextResponse.json(result);

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