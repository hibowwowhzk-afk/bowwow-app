// src/app/api/requests/fromMe/route.ts
import { NextResponse } from 'next/server';
import { RequestRepository } from '@/repositories/RequestRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET() {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
        }

        const requestList = await RequestRepository.getRequestsFromMe(user.user_id);

        return NextResponse.json({ requestList });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
    }
}