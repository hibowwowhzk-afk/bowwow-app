// app/auth/search/page.tsx
import { Suspense } from "react";
import SearchPageClient from "@/app/auth/search/SearchPageClient";

export default function Page() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <SearchPageClient />
        </Suspense>
    );
}