// app/dashboard/page.tsx
'use client';

import { ImmediateDrinks } from '@/app/components/ImmediateDrinks';

export default function DashboardPage() {
    return (
        <div>
            <main className="p-6">
                <ImmediateDrinks />
            </main>
        </div>
    );
}