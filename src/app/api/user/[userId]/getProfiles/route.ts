import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET(req: Request, context: { params: Record<string, string> }) {
    try {
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const userId = context.params.userId;
        if (!userId) {
            return NextResponse.json(
                { error: 'userId が指定されていません' },
                { status: 400 }
            );
        }

        const profile = await UserRepository.findProfileByUserId(userId);
        if (!profile) {
            return NextResponse.json(
                { error: 'ユーザープロフィールが見つかりません' },
                { status: 404 }
            );
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
