import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from '@/repositories/UserRepository';
import { RequestRepository } from "@/repositories/RequestRepository";
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function POST(req: NextRequest) {
    try {
        // =========================
        // 認証
        // =========================
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        // =========================
        // ユーザー取得
        // =========================
        const userWithProfile =
            await UserRepository.findUserWithProfileByUID(uid);

        if (!userWithProfile) {
            return NextResponse.json(
                { error: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // リクエスト取得
        // =========================
        const { to_user_id, post_id, message } = await req.json();

        if (!to_user_id || !post_id) {
            return NextResponse.json(
                { error: 'MISSING_REQUIRED_FIELDS' },
                { status: 400 }
            );
        }

        // =========================
        // メッセージバリデーション（追加）
        // =========================
        if (message && message.length > 200) {
            return NextResponse.json(
                { error: 'MESSAGE_TOO_LONG' },
                { status: 400 }
            );
        }

        // =========================
        // 事前重複チェック（UX改善）
        // =========================
        const existing =
            await RequestRepository.findExistingRequest({
                from_user_id: userWithProfile.user_id,
                to_user_id,
                post_id,
            });

        if (existing) {
            return NextResponse.json(
                { error: 'ALREADY_REQUESTED' },
                { status: 409 }
            );
        }

        // =========================
        // DB保存
        // =========================
        const newRequest =
            await RequestRepository.insertRequest({
                from_user_id: userWithProfile.user_id,
                to_user_id,
                post_id,
                message: message || "よろしくお願いします！",
            });

        return NextResponse.json({
            success: true,
            request: newRequest
        });

    } catch (err: any) {
        console.error("Insert Request Error:", err);

        // =========================
        // UNIQUE制約対策（最重要）
        // =========================
        if (err?.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { error: 'ALREADY_REQUESTED' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }
}