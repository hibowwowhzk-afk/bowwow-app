
import { NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import db from '@/lib/db';
import type { PoolConnection } from 'mysql2/promise';

export async function POST(req: Request) {
    let conn: PoolConnection | null = null;

    try {
        const body = await req.json();
        const { uid, email } = body;

        // 必須項目チェック
        if (!uid || !email) {
            return NextResponse.json(
                { message: 'uid と email は必須です' },
                { status: 400 }
            );
        }

        // DB接続取得
        conn = await db.getConnection();

        // 既存ユーザーチェック
        const existing = await UserRepository.findUserByUID(uid);

        if (existing) {
            return NextResponse.json(
                { message: '既に登録されています' },
                { status: 409 }
            );
        }

        // ユーザー登録
        const userId = await UserRepository.createUser(
            conn,
            uid,
            email
        );

        return NextResponse.json(
            {
                message: '登録完了',
                user_id: userId,
            },
            { status: 200 }
        );

    } catch (e) {
        console.error('ユーザー登録エラー:', e);

        return NextResponse.json(
            { message: 'サーバーエラー' },
            { status: 500 }
        );

    } finally {
        conn?.release();
    }
}
