'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Reason =
    | 'no_show'
    | 'harassment'
    | 'spam'
    | 'other';

export default function ReportPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const targetType = searchParams.get('type'); // match / history
    const targetId = Number(searchParams.get('id'));

    const [reason, setReason] = useState<Reason | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit() {
        if (!targetType || !targetId) {
            alert('不正なアクセスです');
            return;
        }

        if (!reason) {
            alert('理由を選択してください');
            return;
        }

        try {
            setLoading(true);

            const res = await fetch('/api/reports/insertReport', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target_type: targetType,
                    target_id: targetId,
                    reason,
                    comment,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '通報に失敗しました');
            }

            alert('通報しました');
            router.back();
        } catch (e) {
            alert(
                e instanceof Error
                    ? e.message
                    : 'エラーが発生しました'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-bold mb-4">
                通報
            </h1>

            <p className="text-sm text-gray-500 mb-4">
                対象: {targetType} #{targetId}
            </p>

            <div className="space-y-3">
                {[
                    ['no_show', '会えなかった（ドタキャン等）'],
                    ['harassment', '不適切な言動'],
                    ['spam', 'スパム'],
                    ['other', 'その他'],
                ].map(([key, label]) => (
                    <label key={key} className="block">
                        <input
                            type="radio"
                            name="reason"
                            onChange={() =>
                                setReason(key as Reason)
                            }
                        />
                        <span className="ml-2">{label}</span>
                    </label>
                ))}
            </div>

            <textarea
                className="w-full border mt-4 p-2 rounded"
                placeholder="補足（任意）"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            <button
                onClick={submit}
                disabled={loading}
                className="w-full mt-4 bg-red-500 text-white py-2 rounded"
            >
                {loading ? '送信中...' : '通報する'}
            </button>
        </div>
    );
}