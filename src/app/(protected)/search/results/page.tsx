// app/(protected)/search/results/page.tsx
import { Suspense } from 'react';
import SearchResultsPageClient from '@/app/(protected)/search/results/SearchResultsPageClient';

export default function Page() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <SearchResultsPageClient />
        </Suspense>
    );
}
