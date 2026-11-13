'use client';

import { useEffect } from 'react';

export default function ActivityTracker() {
    useEffect(() => {
        const updateLastOpened = () => {
            fetch('/api/user/activity/opened', {
                method: 'POST',
                credentials: 'include',
            });
        };

        // 初回表示・再読み込み
        updateLastOpened();

        // バックグラウンドから復帰
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateLastOpened();
            }
        };

        document.addEventListener(
            'visibilitychange',
            handleVisibilityChange
        );

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
        };
    }, []);

    return null;
}