// app/verify-email/page.tsx

import { VerifyEmailService } from "@/app/services/VerifyEmailService";

type Props = {
    searchParams: Promise<{
        token?: string;
    }>;
};

export default async function VerifyEmailPage({searchParams,}: Props) {
    const { token } = await searchParams;

    const status = await VerifyEmailService.verify(token);

    return (
        <div className="max-w-md mx-auto p-6">
            {status === "success" && (
                <>
                    <h1 className="text-2xl font-bold mb-4 text-green-600">
                        メール認証が完了しました
                    </h1>

                    <p className="mb-4">
                        メールアドレスの認証が正常に完了しました。
                    </p>

                    <p className="text-gray-500">
                        そのままログインしてご利用ください。
                    </p>
                    <a
                        href="/login"
                        className="block text-sm text-gray-500 underline"
                    >
                        ログイン画面へ
                    </a>
                </>
            )}

            {status === "already_verified" && (
                <>
                    <h1 className="text-2xl font-bold mb-4">
                        認証済みです
                    </h1>

                    <p className="mb-4">
                        このメールアドレスは既に認証されています。
                    </p>
                </>
            )}

            {status === "expired" && (
                <>
                    <h1 className="text-2xl font-bold mb-4 text-red-600">
                        認証リンクの有効期限が切れています
                    </h1>

                    <p className="mb-4">
                        認証リンクの有効期限が切れています。
                    </p>

                    <p className="text-gray-500">
                        再度認証メールを送信してください。
                    </p>
                </>
            )}

            {status === "invalid" && (
                <>
                    <h1 className="text-2xl font-bold mb-4 text-red-600">
                        無効な認証リンクです
                    </h1>

                    <p className="mb-4">
                        URLが不正、または既に利用できない状態です。
                    </p>
                </>
            )}
        </div>
    );
}