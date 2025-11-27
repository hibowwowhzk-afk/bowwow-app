import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository } from '@/repositories/PostRepository';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // 1. セッション認証
        const authResult = await verifySessionFromRequest();
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // 2. postId 取得
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const postIdStr = pathSegments[pathSegments.length - 2];
        if (!postIdStr) return NextResponse.json({ error: 'postId が指定されていません' }, { status: 400 });
        const postId = Number(postIdStr);

        // 3. フォームデータ取得
        const form = await req.formData();
        const message = form.get('message') as string;
        const date = form.get('date') as string;
        const isImmediate = form.get('isImmediate') === '1';
        const newImages = form.getAll('images').slice(0, 2) as File[];
        const imageChanged = form.get('imageChanged') === '1'; // フロントからの変更フラグ

        if (!message?.trim()) {
            return NextResponse.json({ error: 'メッセージは必須です' }, { status: 400 });
        }

        // 4. 基本情報更新
        await PostRepository.updatePostBasic(postId, { message, date, is_immediate: isImmediate });

        // 5. 画像に変更がある場合
        if (imageChanged) {
            // 5-1. 投稿に紐づく既存画像取得
            const existingImages = await PostRepository.findPostImagesByPostId(postId);

            // 5-2. Cloudinary から削除
            for (const img of existingImages) {
                try {
                    const filename = img.image_url.split('/').pop()!;
                    const publicId = filename.split('.')[0];
                    await cloudinary.uploader.destroy(`posts/${publicId}`);
                } catch (e) {
                    console.error('Cloudinary delete error:', e);
                }
            }

            // 5-3. DB から全削除
            await PostRepository.deleteAllPostImages(postId);

            // 5-4. 新規画像を Cloudinary にアップロード & DB 登録
            for (let i = 0; i < newImages.length; i++) {
                const file = newImages[i] as any;
                const buffer = Buffer.from(await file.arrayBuffer());

                await new Promise<void>((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'posts',
                            transformation: [{ width: 500, height: 500, crop: 'fill' }],
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
        }

        return NextResponse.json({ post_id: postId, message: '投稿が更新されました' });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message || '更新に失敗しました' }, { status: 500 });
    }
}
