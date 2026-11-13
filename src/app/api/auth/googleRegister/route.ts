import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { PoolConnection } from 'mysql2/promise';

import db from '@/lib/db';
import { UserRepository } from '@/repositories/UserRepository';
import { UserActivityRepository } from "@/repositories/UserActivityRepository";

export async function POST(request: NextRequest) {
    let conn: PoolConnection | null = null;
    let transactionStarted = false;

    try {
        const { idToken } = await request.json();

        // ① IDトークン確認
        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json(
                { error: 'IDトークンがありません' },
                { status: 400 }
            );
        }

        // ② Firebase IDトークン検証
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (!email || !decodedToken.email_verified) {
            return NextResponse.json(
                { error: 'メールアドレスが確認できません' },
                { status: 400 }
            );
        }

        // ③ DB接続・トランザクション開始
        conn = await db.getConnection();

        await conn.beginTransaction();
        transactionStarted = true;

        // ④ Firebase UIDで既存ユーザー確認
        const existingUser =
            await UserRepository.findGoogleUserByUID(conn, uid);

        if (existingUser) {
            await conn.rollback();
            transactionStarted = false;

            return NextResponse.json(
                { error: 'このアカウントは既に登録されています' },
                { status: 409 }
            );
        }

        // ⑤ メールアドレス重複確認
        const existingEmail =
            await UserRepository.findGoogleUserByEmail(conn, email);

        if (existingEmail) {
            await conn.rollback();
            transactionStarted = false;

            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 409 }
            );
        }

        // ⑥ Googleユーザー登録
        const userId = await UserRepository.createGoogleUser(
            conn,
            uid,
            email
        );

        // アクティビティ登録
        await UserActivityRepository.createUser(conn, userId);

        // ⑦ コミット
        await conn.commit();
        transactionStarted = false;

        return NextResponse.json({
            success: true,
            user_id: userId,
        });

    } catch (error: any) {
        console.error('[GOOGLE_REGISTER_ERROR]', error);

        if (transactionStarted && conn) {
            await conn.rollback();
        }

        // UNIQUE制約による重複エラー
        if (error?.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { error: 'このアカウントは既に登録されています' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Google登録に失敗しました' },
            { status: 500 }
        );

    } finally {
        conn?.release();
    }
}