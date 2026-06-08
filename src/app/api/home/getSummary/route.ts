import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/firebase-session";

import { UserRepository } from "@/repositories/UserRepository";
import { PostRepository } from "@/repositories/PostRepository";
import { RequestRepository } from "@/repositories/RequestRepository";
import { MatchesRepository } from "@/repositories/MatchesRepository";

export async function GET() {
    try {
        const authResult = await verifySessionFromRequest();

        if ("error" in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        const user =
            await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: "ユーザー情報が見つかりません" },
                { status: 404 }
            );
        }

        const userId = user.user_id;

        const [
            postCount,
            sentRequestCount,
            receivedRequestCount,
            matchingCount,
        ] = await Promise.all([
            PostRepository.countByUserId(userId),
            RequestRepository.countFromMe(userId),
            RequestRepository.countFromOthers(userId),
            MatchesRepository.countByUserId(userId),
        ]);

        return NextResponse.json({
            postCount,
            sentRequestCount,
            receivedRequestCount,
            matchingCount,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "データ取得に失敗しました" },
            { status: 500 }
        );
    }
}