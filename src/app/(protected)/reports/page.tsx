import { Suspense } from 'react';
import ReportContent from './ReportContent';

export default function ReportPage() {
    return (
        <Suspense fallback={<div className="p-6">読み込み中...</div>}>
            <ReportContent />
        </Suspense>
    );
}