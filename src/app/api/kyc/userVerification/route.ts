// src/app/api/user/userVerification.ts

import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';

export async function GET(req: NextRequest) {
    try {
        /* ------------------------------
         * 1. セッション認証
         * ------------------------------ */
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
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

        // KYC確認
        const verified = user.kyc_status === 'approved';

        return NextResponse.json({
            verified,
            kycStatus: user.kyc_status,
        });

    } catch (err) {
        console.error('userVerification error:', err);

        return NextResponse.json(
            {
                verified: false,
                error: 'Internal Server Error',
            },
            { status: 500 }
        );
    }
}