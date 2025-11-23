// page.tsx
import { Suspense } from "react";
import MatchingsPageClient from "@/app/auth/matchings/MatchingsPageClient";

export default function Page() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <MatchingsPageClient />
        </Suspense>
    );
}