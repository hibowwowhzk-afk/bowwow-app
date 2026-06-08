// app/dashboard/page.tsx
'use client';

import { ImmediateDrinks } from '@/app/components/ImmediateDrinks';
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div>
            <main className="p-6 max-w-lg mx-auto">
                {/* 左側に検索ボタンを配置 */}
                <div className="flex justify-start mb-4">
                    <Link href="/search">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            条件で探す
                        </button>
                    </Link>
                </div>

                <ImmediateDrinks />
            </main>
        </div>
    );
}
