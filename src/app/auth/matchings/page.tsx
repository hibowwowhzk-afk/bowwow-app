// page.tsx
import { Suspense } from "react";
import MatchingsPageClient from "@/app/components/ui/MatchingsPageClient";

export default function Page() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <MatchingsPageClient />
        </Suspense>
    );
}