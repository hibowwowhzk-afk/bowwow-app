// src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server';
import { PostRepository } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { v2 as cloudinary } from 'cloudinary';

// 環境変数から Cloudinary 設定
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        // セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const uid = authResult.uid;

        // 自分のユーザー情報を取得
        const userInfo = await UserRepository.findUserByUID(uid);
        if (userInfo.kyc_status !== 'approved') {
            return NextResponse.json({ error: 'KYC_REQUIRED' }, { status: 404 });
        }

        // 自分のプロフィール取得
        const user = await UserRepository.findUserWithProfileByUID(uid);
        if (!user) {
            return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 404 });
        }

        // 自分のプロフィール取得
        const formData = await req.formData();
        const date = formData.get('date') as string;
        const futurePostCount = await PostRepository.countFuturePostsByUser(
            user.user_id,
            date
        );

        if (futurePostCount >= 3) {
            return NextResponse.json(
                { error: 'FUTURE_POST_LIMIT' },
                { status: 400 }
            );
        }

        const message = formData.get('message') as string;
        const isImmediate = formData.get('isImmediate') === '1';
        const files = formData.getAll('images').slice(0, 2) as File[];

        if (!message?.trim()) {
            return NextResponse.json({ error: 'メッセージは必須です' }, { status: 400 });
        }

        const postResult = await PostRepository.createPost({
            user_id: user.user_id,
            date,
            message,
            isImmediate,
        });    
        const postId = postResult.post_id;

        // 画像を Cloudinary にアップロードして post_images に登録
        for (let i = 0; i < files.length; i++) {
            const file = files[i] as any;

            // File/Blob → Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Promise 化して await できる形に
            await new Promise<void>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'posts',
                        transformation: [{ width: 500, height: 500, crop: 'fill' }], // 正方形
                    },
                    async (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return reject(error);
                        }

                        if (result?.secure_url) {
                            // post_images テーブルに登録
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

        return NextResponse.json({ post_id: postId, message: '投稿が作成されました' });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || '投稿作成に失敗しました' }, { status: 500 });
    }
}