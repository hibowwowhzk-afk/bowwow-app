import { NextRequest, NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/firebase-session';
import { PostRepository } from '@/repositories/PostRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function POST(req: NextRequest) {
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

        // Firebase uid
        const firebaseUid = authResult.uid;

        // DBユーザー取得
        const currentUser = await UserRepository.findUserByUID(firebaseUid);

        if (!currentUser) {
            return NextResponse.json(
                { error: 'ユーザーが存在しません' },
                { status: 404 }
            );
        }

        // =========================
        // postId取得
        // =========================
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');
        const postIdStr = pathSegments[pathSegments.length - 2];

        if (!postIdStr) {
            return NextResponse.json(
                { error: 'postId が指定されていません' },
                { status: 400 }
            );
        }

        const postId = Number(postIdStr);

        // 投稿取得
        const postDetail = await PostRepository.getPostDetailById(postId);

        if (!postDetail || postDetail.user_id !== currentUser.user_id) {
            return NextResponse.json(
                { error: 'ポスト情報が見つかりません' },
                { status: 404 }
            );
        }

        // =========================
        // formData
        // =========================
        const form = await req.formData();

        const message = form.get('message') as string;
        const date = form.get('date') as string;
        const isImmediate = form.get('isImmediate') === '1';
        const imageChanged = form.get('imageChanged') === '1';

        const newImages = form.getAll('images') as File[];

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
        // 画像バリデーション（追加）
        // =========================
        if (imageChanged) {
            // 最大枚数
            if (newImages.length > 2) {
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

            const MAX_SIZE = 5 * 1024 * 1024;

            for (const file of newImages) {
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
        }

        // =========================
        // 基本更新
        // =========================
        await PostRepository.updatePostBasic(postId, {
            message,
            date,
            is_immediate: isImmediate,
        });

        // =========================
        // 画像更新
        // =========================
        if (imageChanged) {
            const existingImages =
                await PostRepository.findPostImagesByPostId(postId);

            // Cloudinary削除
            for (const img of existingImages) {
                try {
                    const filename = img.image_url.split('/').pop()!;
                    const publicId = filename.split('.')[0];
                    await cloudinary.uploader.destroy(`posts/${publicId}`);
                } catch (e) {
                    console.error('Cloudinary delete error:', e);
                }
            }

            await PostRepository.deleteAllPostImages(postId);

            // 新規アップロード
            for (let i = 0; i < newImages.length; i++) {
                const file = newImages[i] as File;
                const buffer = Buffer.from(await file.arrayBuffer());

                await new Promise<void>((resolve, reject) => {
                    const uploadStream =
                        cloudinary.uploader.upload_stream(
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

        return NextResponse.json({
            post_id: postId,
            message: '投稿が更新されました',
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            {
                error:
                    err.message || '更新に失敗しました',
            },
            { status: 500 }
        );
    }
}