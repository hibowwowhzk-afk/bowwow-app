import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { UserActivityRepository } from '@/repositories/UserActivityRepository';

export async function POST() {
    try {
        // Firebaseセッション認証
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Firebase UIDからDBのuser_idを取得
        const user = await UserRepository.findUserByUID(authResult.uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりません。' },
                { status: 404 }
            );
        }

        // 最終アクセス日時を更新
        await UserActivityRepository.updateLastOpened(user.user_id);

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error('最終アクセス日時更新エラー:', error);

        return NextResponse.json(
            { error: '最終アクセス日時の更新に失敗しました。' },
            { status: 500 }
        );
    }
}