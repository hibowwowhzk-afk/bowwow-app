// src/app/api/posts/create/route.ts

import { NextResponse } from 'next/server';
import { PostRepository } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { ErrorMessages, ErrorCode } from '@/app/components/ErrorMessages';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        // =========================
        // 認証
        // =========================
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                {
                    code: 'UNAUTHORIZED',
                    message: ErrorMessages.UNAUTHORIZED,
                },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        // =========================
        // ユーザー取得
        // =========================
        const userInfo = await UserRepository.findUserByUID(uid);

        if (!userInfo || userInfo.kyc_status !== 'approved') {
            return NextResponse.json(
                {
                    code: 'KYC_REQUIRED',
                    message: ErrorMessages.KYC_REQUIRED,
                },
                { status: 403 }
            );
        }

        const user = await UserRepository.findUserWithProfileByUID(uid);

        if (!user) {
            return NextResponse.json(
                {
                    code: 'USER_NOT_FOUND',
                    message: ErrorMessages.USER_NOT_FOUND,
                },
                { status: 404 }
            );
        }

        // =========================
        // formData取得
        // =========================
        const formData = await req.formData();

        const rawDate = formData.get('date');
        const rawMessage = formData.get('message');

        const message =
            typeof rawMessage === 'string' ? rawMessage : '';

        let isImmediate = formData.get('isImmediate') === '1';

        const files = formData.getAll('images');

        // =========================
        // メッセージバリデーション
        // =========================
        if (!message.trim()) {
            return NextResponse.json(
                {
                    code: 'MESSAGE_REQUIRED',
                    message: ErrorMessages.MESSAGE_REQUIRED,
                },
                { status: 400 }
            );
        }

        if (message.length > 200) {
            return NextResponse.json(
                {
                    code: 'MESSAGE_TOO_LONG',
                    message: ErrorMessages.MESSAGE_TOO_LONG,
                },
                { status: 400 }
            );
        }

        // =========================
        // 日付バリデーション
        // =========================
        if (typeof rawDate !== 'string' || !rawDate) {
            return NextResponse.json(
                {
                    code: 'DATE_REQUIRED',
                    message: ErrorMessages.DATE_REQUIRED,
                },
                { status: 400 }
            );
        }

        // 日付形式チェック
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            return NextResponse.json(
                {
                    code: 'DATE_REQUIRED',
                    message: ErrorMessages.DATE_REQUIRED,
                },
                { status: 400 }
            );
        }

        const inputDate = new Date(`${rawDate}T00:00:00`);

        if (
            Number.isNaN(inputDate.getTime()) ||
            inputDate.getFullYear() !== Number(rawDate.substring(0, 4)) ||
            inputDate.getMonth() + 1 !== Number(rawDate.substring(5, 7)) ||
            inputDate.getDate() !== Number(rawDate.substring(8, 10))
        ) {
            return NextResponse.json(
                {
                    code: 'DATE_REQUIRED',
                    message: ErrorMessages.DATE_REQUIRED,
                },
                { status: 400 }
            );
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (inputDate < today) {
            return NextResponse.json(
                {
                    code: 'PAST_DATE_NOT_ALLOWED',
                    message: ErrorMessages.PAST_DATE_NOT_ALLOWED,
                },
                { status: 400 }
            );
        }

        const date = rawDate;

        if (inputDate.getTime() === today.getTime()) {
            isImmediate = true;
        } else {
            isImmediate = false;
        }

        // =========================
        // 画像バリデーション
        // =========================

        // 枚数制限
        if (files.length > 2) {
            return NextResponse.json(
                {
                    code: 'IMAGE_LIMIT_EXCEEDED',
                    message: ErrorMessages.IMAGE_LIMIT_EXCEEDED,
                },
                { status: 400 }
            );
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        const MAX_SIZE = 5 * 1024 * 1024;

        for (const file of files) {
            if (!(file instanceof File)) {
                return NextResponse.json(
                    {
                        code: 'INVALID_IMAGE',
                        message: ErrorMessages.INVALID_IMAGE,
                    },
                    { status: 400 }
                );
            }

            if (file.size === 0) {
                return NextResponse.json(
                    {
                        code: 'EMPTY_IMAGE',
                        message: ErrorMessages.EMPTY_IMAGE,
                    },
                    { status: 400 }
                );
            }

            if (file.size > MAX_SIZE) {
                return NextResponse.json(
                    {
                        code: 'IMAGE_TOO_LARGE',
                        message: ErrorMessages.IMAGE_TOO_LARGE,
                    },
                    { status: 400 }
                );
            }

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    {
                        code: 'INVALID_IMAGE_TYPE',
                        message: ErrorMessages.INVALID_IMAGE_TYPE,
                    },
                    { status: 400 }
                );
            }
        }

        // =========================
        // 投稿制限チェック
        // =========================
        const futurePostCount =
            await PostRepository.countFuturePostsByUser(
                user.user_id
            );

        if (futurePostCount >= 3) {
            return NextResponse.json(
                {
                    code: 'FUTURE_POST_LIMIT',
                    message: ErrorMessages.FUTURE_POST_LIMIT,
                },
                { status: 400 }
            );
        }

        const alreadyPostCount =
            await PostRepository.countAlreadyPostsByUser(
                user.user_id,
                date
            );

        if (alreadyPostCount > 0) {
            return NextResponse.json(
                {
                    code: 'ALREADY_POSTED_TODAY',
                    message: ErrorMessages.ALREADY_POSTED_TODAY,
                },
                { status: 400 }
            );
        }

        // =========================
        // 投稿作成
        // =========================
        const postResult = await PostRepository.createPost({
            user_id: user.user_id,
            date,
            message,
            isImmediate,
        });

        const postId = postResult.post_id;

        // =========================
        // 画像アップロード
        // =========================
        for (let i = 0; i < files.length; i++) {
            const file = files[i] as File;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await new Promise<void>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'posts',
                        transformation: [
                            {
                                width: 500,
                                height: 500,
                                crop: 'fill',
                            },
                        ],
                    },
                    async (error, result) => {
                        try {
                            if (error) {
                                reject(error);
                                return;
                            }

                            if (!result?.secure_url) {
                                reject(new Error('画像アップロードに失敗しました'));
                                return;
                            }

                            await PostRepository.addPostImage({
                                post_id: postId,
                                image_url: result.secure_url,
                                order: i + 1,
                            });

                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }
                );

                uploadStream.end(buffer);
            });
        }

        // =========================
        // 成功レスポンス
        // =========================
        return NextResponse.json({
            post_id: postId,
            message: '投稿が作成されました',
        });

    } catch (error: unknown) {
        console.error('[POST_CREATE_ERROR]', error);

        return NextResponse.json(
            {
                code: 'INTERNAL_SERVER_ERROR',
                message: ErrorMessages.INTERNAL_SERVER_ERROR,
            },
            { status: 500 }
        );
    }
}