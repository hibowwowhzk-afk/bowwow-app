// src/app/api/matchings/[matchId]/notifySnsMessage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { SnsNotificationsRepository } from '@/repositories/SnsNotificationsRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');

        const matchIdStr =
            pathSegments[pathSegments.length - 2];

        if (!matchIdStr) {
            return NextResponse.json(
                { error: 'MATCH_ID_REQUIRED' },
                { status: 400 }
            );
        }

        const matchId = Number(matchIdStr);

        if (isNaN(matchId)) {
            return NextResponse.json(
                { error: 'INVALID_MATCH_ID' },
                { status: 400 }
            );
        }

        // =========================
        // 認証
        // =========================
        const authResult =
            await verifySessionFromRequest();

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
        const user =
            await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'USER_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // body
        // =========================
        const body = await req.json();

        const message: string =
            body.message?.trim();

        // =========================
        // message validation
        // =========================
        if (!message) {
            return NextResponse.json(
                { error: 'MESSAGE_REQUIRED' },
                { status: 400 }
            );
        }

        if (message.length > 200) {
            return NextResponse.json(
                { error: 'MESSAGE_TOO_LONG' },
                { status: 400 }
            );
        }

        // =========================
        // match取得
        // =========================
        const match =
            await MatchesRepository.findMatchIdAndToUser(matchId);

        if (!match) {
            return NextResponse.json(
                { error: 'MATCH_NOT_FOUND' },
                { status: 404 }
            );
        }

        // =========================
        // 権限チェック
        // =========================
        if (
            match.from_user_id !== user.user_id &&
            match.to_user_id !== user.user_id
        ) {
            return NextResponse.json(
                { error: 'FORBIDDEN' },
                { status: 403 }
            );
        }

        // =========================
        // 既存通知チェック
        // =========================
        const alreadyExists =
            await SnsNotificationsRepository.findByMatchId(matchId);

        if (alreadyExists) {
            return NextResponse.json(
                { error: 'ALREADY_NOTIFIED' },
                { status: 400 }
            );
        }
        let dmFromUserId;
        let dmToUserId;

        if (match.from_user_id === user.user_id) {
            dmFromUserId = match.from_user_id;
            dmToUserId = match.to_user_id;
        } else {
            dmFromUserId = match.to_user_id;
            dmToUserId = match.from_user_id;
        }

        // =========================
        // 通知登録
        // =========================
        await SnsNotificationsRepository.create({
            match_id: match.match_id,
            from_user_id: dmFromUserId,
            to_user_id: dmToUserId,
            message,
        });

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }
}