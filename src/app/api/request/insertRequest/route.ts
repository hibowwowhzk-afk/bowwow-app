// src/app/api/request/insertRequest/route.ts

import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from '@/repositories/userRepository';
import { RequestRepository } from "@/repositories/RequestRepository";
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function POST(req: NextRequest) {
    try {
        // セッション認証関数
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        // ユーザーとプロフィールをまとめて取得
        const userWithProfile = await UserRepository.findUserWithProfileByUID(uid);
        if (!userWithProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // リクエスト内容を取得
        const { to_user_id, post_id, message } = await req.json();

        if (!to_user_id || !post_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // DBに保存
        const newRequest = await RequestRepository.insertRequest({
            from_user_id: userWithProfile.user_id,
            to_user_id,
            post_id,
            message: message || "よろしくお願いします！",
        });

        return NextResponse.json({ success: true, request: newRequest });
    } catch (err) {
        console.error("Insert Request Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}