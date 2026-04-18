import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { uid, email } = body;

        if (!uid || !email) {
            return NextResponse.json(
                { message: 'uid と email は必須です' },
                { status: 400 }
            );
        }

        // 既存チェック
        const existing = await UserRepository.findUserByUID(uid);
        if (existing) {
            return NextResponse.json(
                { message: '既に登録されています' },
                { status: 409 }
            );
        }

        // 登録
        const userId = await UserRepository.createUser(uid, email);

        return NextResponse.json(
            {
                message: '登録完了',
                user_id: userId,
            },
            { status: 200 }
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { message: 'サーバーエラー' },
            { status: 500 }
        );
    }
}
