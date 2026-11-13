import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { UserRepository } from '@/repositories/UserRepository';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // ------------------------------
        // 1. セッション認証
        // ------------------------------
        const authResult = await verifySessionFromRequest();

        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const uid = authResult.uid;

        // ------------------------------
        // 2. user_id 取得
        // ------------------------------
        const user = await UserRepository.findUserByUID(uid);

        if (!user) {
            return NextResponse.json(
                { error: 'ユーザーが見つかりませんでした' },
                { status: 404 }
            );
        }

        const userId = user.user_id;

        // ------------------------------
        // 3. フォームデータ取得
        // ------------------------------
        const form = await req.formData();

        const display_name = form.get('display_name') as string;
        const age = Number(form.get('age'));
        const residence = form.get('residence') as string;
        const occupation = form.get('occupation') as string;
        const message = form.get('message') as string;

        // SNSアカウント
        const x_account = (form.get('x_account') as string)?.trim() || '';
        const instagram_account =
            (form.get('instagram_account') as string)?.trim() || '';

        const imageChanged = form.get('imageChanged') === '1';
        const imageDeleted = form.get('imageDeleted') === '1';
        const newImage = form.get('image') as File | null;

        if (!display_name || Number.isNaN(age)) {
            return NextResponse.json(
                { error: '入力が不正です' },
                { status: 400 }
            );
        }

        // SNSアカウントはどちらか一方必須
        if (!x_account && !instagram_account) {
            return NextResponse.json(
                { error: 'XまたはInstagramのアカウントを入力してください' },
                { status: 400 }
            );
        }

        // ------------------------------
        // 4. 既存画像取得（画像処理用）
        // ------------------------------
        let existingImage = null;

        if (imageChanged) {
            existingImage =
                await UserRepository.findProfileImageByUserId(userId);
        }

        // ------------------------------
        // 5. 画像処理を先に実行
        // ------------------------------
        let uploadedImageUrl: string | null = null;

        if (imageChanged) {
            // 5-1. 新画像がある場合は先に Cloudinary に upload
            if (newImage) {
                const buffer = Buffer.from(await newImage.arrayBuffer());

                uploadedImageUrl = await new Promise<string>(
                    (resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: 'profile',
                                transformation: [
                                    { width: 400, height: 400, crop: 'fill' },
                                ],
                            },
                            (error, result) => {
                                if (error || !result?.secure_url) {
                                    return reject(error);
                                }

                                resolve(result.secure_url);
                            }
                        );

                        uploadStream.end(buffer);
                    }
                );
            }

            // 5-2. 既存画像があれば Cloudinary から削除
            if (existingImage) {
                const filename = existingImage.image_url.split('/').pop()!;
                const publicId = filename.split('.')[0];

                await cloudinary.uploader.destroy(
                    `profile/${publicId}`
                );
            }
        }

        // ------------------------------
        // 6. プロフィール基本情報・SNS更新
        // ------------------------------
        await UserRepository.updateProfile(userId, {
            display_name,
            age,
            residence,
            occupation,
            message,
            x_username: x_account,
            insta_username: instagram_account,
            updated_by: uid,
        });

        // ------------------------------
        // 7. 画像DB更新
        // ------------------------------
        if (imageChanged) {
            // 7-1. 既存画像レコード削除
            if (existingImage) {
                await UserRepository.deleteProfileImage(userId);
            }

            // 7-2. 削除のみでなければ新規登録
            if (!imageDeleted && uploadedImageUrl) {
                await UserRepository.addProfileImage({
                    user_id: userId,
                    image_url: uploadedImageUrl,
                    order: 1,
                });
            }
        }

        return NextResponse.json({
            message: 'プロフィールを更新しました',
        });

    } catch (err: any) {
        console.error('[UPDATE_PROFILE_ERROR]', err);

        return NextResponse.json(
            { error: err.message || 'サーバーエラー' },
            { status: 500 }
        );
    }
}