// src/app/api/user/[userId]/getProfiles/route.ts

import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { MatchesRepository } from '@/repositories/MatchesRepository';
import { RequestRepository } from '@/repositories/RequestRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET(req: Request) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const uid = authResult.uid;

        /* ------------------------------
         * 2. user_id 取得
         * ------------------------------ */
        const user = await UserRepository.findUserByUID(uid);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        const meUserId = user.user_id;

        // URLから otherUserId を取得
        const url = new URL(req.url);
        const source = url.searchParams.get('source');
        const pathSegments = url.pathname.split('/');
        // 例: /api/user/123/getProfiles
        const userIdStr = pathSegments[pathSegments.length - 2];
        const otherUserId = Number(userIdStr);
        if (!otherUserId) {
            return NextResponse.json({ error: 'userId が指定されていません' }, { status: 400 });
        }

        if(source == "matches") {
            const matchExists = await MatchesRepository.existsActiveMatchBetweenUsers(meUserId, otherUserId);
            if (!matchExists) {
                return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            }
        } else if(source == "requests") {
            const requestExists = await RequestRepository.existsActiveRequestBetweenUsers(meUserId, otherUserId);
            if (!requestExists) {
                return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
            }            
        } else {
            return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }

        const profile = await UserRepository.findProfileWithImageByUserId(otherUserId);
        if (!profile) {
            return NextResponse.json({ error: 'ユーザープロフィールが見つかりません' }, { status: 404 });
        }

        return NextResponse.json({ profile }, { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'プロフィール取得中にエラーが発生しました' },
            { status: 500 }
        );
    }
}