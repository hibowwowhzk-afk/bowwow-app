import { Suspense } from "react";
import RequestsPageClient from "@/app/auth/requests/RequestsPageClient";

export default function Page() {
    return (
        <Suspense fallback={<div>読み込み中...</div>}>
            <RequestsPageClient />
        </Suspense>
    );
}