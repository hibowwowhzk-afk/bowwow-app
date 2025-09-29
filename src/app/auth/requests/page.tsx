'use client';

import React, { useEffect, useState } from 'react';

type FromUser = {
    request_id: number;
    request_message: string;
    request_created_at: string;
    user_display_name: string;
    user_profile_image: string | null;
};

export default function RequestsPage() {
    const [fromUserList, setFromUserList] = useState<FromUser[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFromUserList() {
            try {
                const res = await fetch('/api/request/getRequests');
                const data = await res.json();
                if (res.ok) {
                    setFromUserList(data.fromUserList);
                } else {
                    setError(data.error || 'データの取得に失敗しました');
                }
            } catch (error) {
                setError('ネットワークエラーが発生しました');
            }
        }

        fetchFromUserList();
    }, []);

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">リクエスト一覧</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <ul className="space-y-4">
                {fromUserList.length === 0 ? (
                    <li className="text-gray-500">リクエストはありません</li>
                ) : (
                    fromUserList.map((user) => (
                        <li key={user.request_id} className="flex items-center p-4 bg-white border rounded-lg shadow-sm hover:bg-gray-50">
                            {/* プロフィール画像 */}
                            <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                                {user.user_profile_image ? (
                                    <img
                                        src={user.user_profile_image}
                                        alt={user.user_display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                                        {user.user_display_name[0]}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                {/* ユーザー情報 */}
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-medium">{user.user_display_name}</h2>
                                    <span className="text-sm text-gray-500">
                                        {new Date(user.request_created_at).toLocaleString()}
                                    </span>
                                </div>

                                {/* リクエストメッセージ */}
                                <div className="mb-3">
                                    <p className="text-sm text-blue-800 font-medium">リクエストメッセージ:</p>
                                    <p className="text-sm text-gray-700">{user.request_message}</p>
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}