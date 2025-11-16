import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { UserActivityRepository } from '@/repositories/UserActivityRepository';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body;

        // 'requests' | 'accepted' | 'dm' をサポート
        if (type !== 'requests' && type !== 'accepted' && type !== 'dm') {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const uid = authResult.uid;

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            throw new Error('ユーザー情報が見つかりません');
        }

        await UserActivityRepository.markAsRead(user.user_id, type);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
