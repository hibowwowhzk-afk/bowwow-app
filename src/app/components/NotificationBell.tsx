'use client';

import { BellIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Request = {
    request_id: number;
    request_message: string;
    request_created_at?: string;
    request_updated_at?: string;
    user_display_name: string;
    user_profile_image?: string | null;
};

type DMNotification = {
    match_id: number;
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
    const [acceptedRequests, setAcceptedRequests] = useState<Request[]>([]);
    const [dmNotifications, setDmNotifications] = useState<DMNotification[]>([]);
    const router = useRouter();

    // 通知取得
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) return;
            const data = await res.json();

            setPendingRequests(data.pendingRequests || []);
            setAcceptedRequests(data.acceptedRequests || []);
            setDmNotifications(data.dmNotifications || []);
        } catch (e) {
            console.error('通知取得失敗:', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (type: 'requests' | 'accepted' | 'dm') => {
        try {
            await fetch(`/api/notifications/mark-as-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });
        } catch (e) {
            console.error('既読処理失敗:', e);
        }
    };

    const handleClick = async (type: 'requests' | 'accepted' | 'dm') => {
        await markAsRead(type);

        if (type === 'requests') {
            const ids = pendingRequests.map(r => r.request_id).join(',');
            router.push(`/auth/requests?highlight=${ids}`);
        } else if (type === 'accepted') {
            const ids = acceptedRequests.map(r => r.request_id).join(',');
            router.push(`/auth/matchings?highlight=${ids}`);
        } else if (type === 'dm') {
            const ids = dmNotifications.map(n => n.match_id).join(',');
            router.push(`/auth/matchings?highlight=${ids}`);
        }

        await fetchNotifications();
    };

    const pendingCount = pendingRequests.length;
    const acceptedCount = acceptedRequests.length;
    const dmCount = dmNotifications.length;
    const unreadCount = pendingCount + acceptedCount + dmCount;

    const renderMessage = (status: 'pending' | 'accepted' | 'dm', count: number) => {
        if (status === 'pending') return `${count}件のリクエストが届いています`;
        if (status === 'accepted') return `${count}件のリクエスト承諾がありました`;
        if (status === 'dm') return `${count}件のDM送信通知があります`;
        return '';
    };

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="relative">
                <BellIcon className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-black rounded-lg shadow-lg p-2 z-50">
                    <h3 className="font-semibold mb-2">通知</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {pendingCount === 0 && acceptedCount === 0 && dmCount === 0 && (
                            <li className="text-sm text-gray-500 p-2">通知はありません</li>
                        )}

                        {pendingCount > 0 && (
                            <li
                                className="p-2 rounded cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
                                onClick={() => handleClick('requests')}
                            >
                                {renderMessage('pending', pendingCount)}
                            </li>
                        )}

                        {acceptedCount > 0 && (
                            <li
                                className="p-2 rounded cursor-pointer bg-blue-50 hover:bg-blue-100 transition"
                                onClick={() => handleClick('accepted')}
                            >
                                {renderMessage('accepted', acceptedCount)}
                            </li>
                        )}

                        {dmCount > 0 && (
                            <li
                                className="p-2 rounded cursor-pointer bg-green-50 hover:bg-green-100 transition"
                                onClick={() => handleClick('dm')}
                            >
                                {renderMessage('dm', dmCount)}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
