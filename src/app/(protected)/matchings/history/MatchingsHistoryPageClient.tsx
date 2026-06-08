'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type FeedbackResult = 'met' | 'not_met' | null;

type HistoryItem = {
    match_id: number;
    user_display_name: string;
    post_date: string;
    feedback_result: FeedbackResult;
};

export default function MatchingsHistoryPageClient() {
    const router = useRouter();

    const [histories, setHistories] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answeringMatchId, setAnsweringMatchId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    async function fetchHistory() {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/matchings/getHistory', {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || '履歴の取得に失敗しました');
            }

            if (!Array.isArray(data?.histories)) {
                throw new Error('データ形式が不正です');
            }

            setHistories(data.histories);
        } catch (e) {
            setError(e instanceof Error ? e.message : '履歴の取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }

    async function submitFeedback(
        matchId: number,
        result: 'met' | 'not_met'
    ) {
        if (submitting) return;

        try {
            setSubmitting(true);

            const res = await fetch(`/api/matchings/${matchId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ result }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.error || '回答に失敗しました');
            }

            // 楽観的更新（安全版）
            setHistories(prev =>
                prev.map(item =>
                    item.match_id === matchId
                        ? { ...item, feedback_result: result }
                        : item
                )
            );

            setAnsweringMatchId(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : '回答に失敗しました');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="max-w-md mx-auto p-6">
                読み込み中...
            </div>
        );
    }

    const unansweredCount = histories.reduce(
        (acc, h) => acc + (h.feedback_result === null ? 1 : 0),
        0
    );

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold mb-2">
                マッチング履歴
            </h1>

            <p className="text-sm text-gray-500 mb-4">
                開催終了後のマッチング一覧です。
            </p>

            {error && (
                <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-600">
                    {error}
                </div>
            )}

            {unansweredCount > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    未回答 {unansweredCount} 件
                </div>
            )}

            {histories.length === 0 ? (
                <div className="text-gray-500">
                    履歴はありません
                </div>
            ) : (
                <ul className="space-y-3">
                    {histories.map(item => (
                        <li
                            key={item.match_id}
                            className="bg-white border rounded-xl p-4 shadow-sm"
                        >
                            <div className="font-semibold text-lg">
                                {item.user_display_name}
                            </div>

                            <div className="text-sm text-gray-500 mt-1">
                                開催日: {item.post_date}
                            </div>

                            <div className="mt-2">
                                {item.feedback_result === null ? (
                                    <span className="text-orange-500 text-sm">
                                        未回答
                                    </span>
                                ) : item.feedback_result === 'met' ? (
                                    <span className="text-green-600 text-sm">
                                        会えた
                                    </span>
                                ) : (
                                    <span className="text-gray-600 text-sm">
                                        会えなかった
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                                {item.feedback_result === null && (
                                    <button
                                        disabled={submitting}
                                        onClick={() =>
                                            setAnsweringMatchId(item.match_id)
                                        }
                                        className="w-full py-2 bg-green-500 text-white rounded disabled:opacity-50"
                                    >
                                        結果回答
                                    </button>
                                )}

                                <button
                                    onClick={() =>
                                        router.push(
                                            `/reports?type=history&id=${item.match_id}`
                                        )
                                    }
                                    className="w-full py-2 bg-red-500 text-white rounded"
                                >
                                    通報
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {answeringMatchId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-lg w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-4">
                            結果を選択
                        </h2>

                        <div className="space-y-2">
                            <button
                                disabled={submitting}
                                onClick={() =>
                                    submitFeedback(answeringMatchId, 'met')
                                }
                                className="w-full py-2 bg-green-500 text-white rounded"
                            >
                                会えた
                            </button>

                            <button
                                disabled={submitting}
                                onClick={() =>
                                    submitFeedback(answeringMatchId, 'not_met')
                                }
                                className="w-full py-2 bg-gray-600 text-white rounded"
                            >
                                会えなかった
                            </button>

                            <button
                                onClick={() => setAnsweringMatchId(null)}
                                className="w-full py-2 border rounded"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}