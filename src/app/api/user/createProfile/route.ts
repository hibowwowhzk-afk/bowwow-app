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
                { error: 'ユーザーが見つかりませんでした' },
                { status: 404 }
            );
        }
        const userId = user.user_id;

        /* ------------------------------
         * 3. フォームデータ取得
         * ------------------------------ */
        const form = await req.formData();

        const display_name = form.get('display_name') as string;
        const age = Number(form.get('age'));
        const genderStr = form.get('gender') as 'male' | 'female' | '';
        const residence = form.get('residence') as string;
        const occupation = form.get('occupation') as string;
        const message = form.get('message') as string;

        const imageChanged = form.get('imageChanged') === '1';
        const imageDeleted = form.get('imageDeleted') === '1';
        const newImage = form.get('image') as File | null;

        /* ------------------------------
         * 4. バリデーション
         * ------------------------------ */
        if (!display_name || Number.isNaN(age)) {
            return NextResponse.json(
                { error: '表示名と年齢は必須です' },
                { status: 400 }
            );
        }

        if (age < 18) {
            return NextResponse.json(
                { error: '18歳未満は登録できません' },
                { status: 400 }
            );
        }

        let gender: number;
        if (genderStr === 'male') {
            gender = 1;
        } else if (genderStr === 'female') {
            gender = 2;
        } else {
            return NextResponse.json(
                { error: '性別が不正です' },
                { status: 400 }
            );
        }

        /* ------------------------------
        * 5. 画像アップロード
        * ------------------------------ */
        let uploadedImageUrl: string | null = null;

        if (newImage) { // imageChanged フラグ不要
            const buffer = Buffer.from(await newImage.arrayBuffer());

            uploadedImageUrl = await new Promise<string>((resolve, reject) => {
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
            });
        }

        /* ------------------------------
         * 6. プロフィール作成
         * ------------------------------ */
        await UserRepository.createProfile({
            user_id: userId,
            display_name,
            age,
            gender,
            residence,
            occupation,
            message,
            created_by: uid,
            updated_by: uid,
        });

        /* ------------------------------
         * 7. 画像登録
         * ------------------------------ */
        if (uploadedImageUrl) {
            await UserRepository.addProfileImage({
                user_id: userId,
                image_url: uploadedImageUrl,
                order: 1,
            });
        }

        /* ------------------------------
         * 8. 完了フラグ更新
         * ------------------------------ */
        await UserRepository.updateProfileCompleted(userId, 1);

        return NextResponse.json({
            message: 'プロフィールを作成しました',
        });
    } catch (err: any) {
        console.error('[CREATE_PROFILE_ERROR]', err);
        return NextResponse.json(
            { error: err.message || 'サーバーエラー' },
            { status: 500 }
        );
    }
}
