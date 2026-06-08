import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { ReportRepository } from '@/repositories/ReportRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

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
        const user = await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // body取得
        // =========================
        const body = await req.json();

        const {
            target_type,
            target_id,
            reason,
            comment
        } = body;

        // =========================
        // バリデーション
        // =========================
        if (!target_type || !target_id || !reason) {
            return NextResponse.json(
                { error: 'INVALID_PARAMS' },
                { status: 400 }
            );
        }

        // マッチ取得
        const match = await MatchesRepository.findById(target_id);

        if (!match) {
            return NextResponse.json(
                { error: 'MATCH_NOT_FOUND' },
                { status: 404 }
            );
        }

        // 権限チェック
        const isParticipant = match.from_user_id === user.user_id ||
            match.to_user_id === user.user_id;

        if (!isParticipant) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }
        
        const targetUserId = match.from_user_id === user.user_id
                ? match.to_user_id
                : match.from_user_id;

        // =========================
        // INSERT
        // =========================
        await ReportRepository.insert({
            reporter_id: user.user_id,
            target_user_id: targetUserId,
            target_type: target_type,
            target_id: target_id,
            reason: reason,
            comment: comment ?? null,
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'SERVER_ERROR' },
            { status: 500 }
        );
    }
}