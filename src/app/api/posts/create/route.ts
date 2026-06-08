import { NextResponse } from 'next/server';
import { PostRepository } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';
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
                { error: authResult.error },
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
                { error: 'KYC_REQUIRED' },
                { status: 403 }
            );
        }

        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            return NextResponse.json(
                { error: 'ユーザー情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // formData取得
        // =========================
        const formData = await req.formData();

        const rawDate = formData.get('date') as string;
        const message = formData.get('message') as string;
        let isImmediate = formData.get('isImmediate') === '1';

        const files = formData.getAll('images') as File[];

        // =========================
        // messageバリデーション
        // =========================
        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'メッセージは必須です' },
                { status: 400 }
            );
        }

        if (message.length > 200) {
            return NextResponse.json(
                { error: 'メッセージは200文字以内です' },
                { status: 400 }
            );
        }

        // =========================
        // 日付処理
        // =========================
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!rawDate) {
            return NextResponse.json(
                { error: '日付は必須です' },
                { status: 400 }
            );
        }

        let date = rawDate;
        const inputDate = new Date(date);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate < today) {
            return NextResponse.json(
                { error: 'PAST_DATE_NOT_ALLOWED' },
                { status: 400 }
            );
        }

        if (inputDate.getTime() === today.getTime()) {
            isImmediate = true;
        } else {
            isImmediate = false;
        }

        // =========================
        // 画像バリデーション（追加）
        // =========================

        // 枚数制限
        if (files.length > 2) {
            return NextResponse.json(
                { error: 'IMAGE_LIMIT_EXCEEDED' },
                { status: 400 }
            );
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        for (const file of files) {
            if (!file) {
                return NextResponse.json(
                    { error: 'INVALID_IMAGE' },
                    { status: 400 }
                );
            }

            if (file.size === 0) {
                return NextResponse.json(
                    { error: 'EMPTY_IMAGE' },
                    { status: 400 }
                );
            }

            if (file.size > MAX_SIZE) {
                return NextResponse.json(
                    { error: 'IMAGE_TOO_LARGE' },
                    { status: 400 }
                );
            }

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: 'INVALID_IMAGE_TYPE' },
                    { status: 400 }
                );
            }
        }

        // =========================
        // 投稿制限チェック
        // =========================
        const futurePostCount = await PostRepository.countFuturePostsByUser(
            user.user_id
        );

        if (futurePostCount >= 3) {
            return NextResponse.json(
                { error: 'FUTURE_POST_LIMIT' },
                { status: 400 }
            );
        }

        const alreadyPostCount = await PostRepository.countAlreadyPostsByUser(
            user.user_id,
            date
        );

        if (alreadyPostCount > 0) {
            return NextResponse.json(
                { error: 'ALREADY_POSTED_TODAY' },
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
                            { width: 500, height: 500, crop: 'fill' },
                        ],
                    },
                    async (error, result) => {
                        if (error) return reject(error);

                        if (result?.secure_url) {
                            await PostRepository.addPostImage({
                                post_id: postId,
                                image_url: result.secure_url,
                                order: i + 1,
                            });
                        }

                        resolve();
                    }
                );

                uploadStream.end(buffer);
            });
        }

        return NextResponse.json({
            post_id: postId,
            message: '投稿が作成されました',
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || '投稿作成に失敗しました' },
            { status: 500 }
        );
    }
}