"use client";

import { useEffect, useState } from "react";

type Summary = {
    postCount: number;
    sentRequestCount: number;
    receivedRequestCount: number;
    matchingCount: number;
};

export default function SummaryCard() {
    const [summary, setSummary] = useState<Summary>({
        postCount: 0,
        sentRequestCount: 0,
        receivedRequestCount: 0,
        matchingCount: 0,
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSummary() {
            try {
                const res = await fetch("/api/home/getSummary");

                if (!res.ok) {
                    throw new Error();
                }

                const data = await res.json();

                setSummary({
                    postCount: data.postCount ?? 0,
                    sentRequestCount: data.sentRequestCount ?? 0,
                    receivedRequestCount: data.receivedRequestCount ?? 0,
                    matchingCount: data.matchingCount ?? 0,
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                読み込み中...
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold">
                現在の状況
            </div>

            <div className="divide-y">
                <div className="flex justify-between items-center p-4">
                    <span>投稿数</span>
                    <span
                        className={`font-bold ${
                            summary.postCount >= 3
                                ? "text-red-600"
                                : ""
                        }`}
                    >
                        {summary.postCount} / 3
                    </span>
                </div>

                <div className="flex justify-between items-center p-4">
                    <span>自分からのリクエスト数</span>
                    <span
                        className={`font-bold ${
                            summary.sentRequestCount >= 5
                                ? "text-red-600"
                                : ""
                        }`}
                    >
                        {summary.sentRequestCount} / 5
                    </span>
                </div>

                <div className="flex justify-between items-center p-4">
                    <span>相手からのリクエスト数</span>
                    <span className="font-bold">
                        {summary.receivedRequestCount}
                    </span>
                </div>

                <div className="flex justify-between items-center p-4">
                    <span>マッチング数</span>
                    <span className="font-bold">
                        {summary.matchingCount}
                    </span>
                </div>
            </div>
        </div>
    );
}