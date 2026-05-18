import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const userId = body.userId || "mock-user";

        // 環境切り替え
        const USE_MOCK = process.env.KYC_MODE !== "prod";

        // ------------------------
        // ① モックモード
        // ------------------------
        if (USE_MOCK) {
            const mockUrl = `/auth/kyc/mock?userId=${userId}`;

            return NextResponse.json({
                url: mockUrl,
                mode: "mock",
            });
        }

        // ------------------------
        // ② 本番eKYCモード（例）
        // ------------------------
        // ここで外部サービスにセッション作成

        const ekycSession = await fetch("https://ekyc-provider.com/api/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.EKYC_API_KEY}`,
            },
            body: JSON.stringify({
                user_id: userId,
                callback_url: `${process.env.APP_URL}/api/kyc/callback`,
            }),
        });

        const data = await ekycSession.json();

        return NextResponse.json({
            url: data.session_url,
            mode: "prod",
        });

    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "kyc_start_failed" },
            { status: 500 }
        );
    }
}